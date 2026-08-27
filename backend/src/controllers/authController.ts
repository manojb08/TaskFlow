import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { env, isProduction } from '../config/env';

const REFRESH_COOKIE = 'taskflow_refresh';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** Shared by invite and forgot-password: a random token whose sha256 hash is stored, never the raw token. */
export function generateCredentialToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashCredentialToken(token) };
}

export function hashCredentialToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  setRefreshCookie(res, refreshToken);

  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  setRefreshCookie(res, refreshToken);

  res.json({ success: true, data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = (req as unknown as { cookies: Record<string, string> }).cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw ApiError.unauthorized('Missing refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  res.json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = (req as unknown as { cookies: Record<string, string> }).cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // Bump tokenVersion so this refresh token (and any other copies of it) can no longer mint access tokens.
      await User.findByIdAndUpdate(payload.sub, { $inc: { tokenVersion: 1 } });
    } catch {
      // Token already invalid/expired — nothing to invalidate.
    }
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.json({ success: true, data: { loggedOut: true } });
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  res.json({ success: true, data: { user } });
});

const GENERIC_FORGOT_PASSWORD_MESSAGE = 'If that email exists, a reset link has been generated.';

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body as { email: string };

  // Always perform the same single write attempt regardless of match, so a timing
  // difference between "email exists" and "email doesn't" can't be used to enumerate accounts.
  const { token, tokenHash } = generateCredentialToken();
  const user = await User.findOneAndUpdate(
    { email },
    {
      credentialTokenHash: tokenHash,
      credentialTokenExpires: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      credentialTokenPurpose: 'reset',
    },
  );

  if (user && !isProduction) {
    res.json({
      success: true,
      data: {
        message: GENERIC_FORGOT_PASSWORD_MESSAGE,
        resetToken: token,
        resetUrl: `${env.clientOrigin}/reset-password?token=${token}`,
      },
    });
    return;
  }

  res.json({ success: true, data: { message: GENERIC_FORGOT_PASSWORD_MESSAGE } });
});

export const setPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };

  const tokenHash = hashCredentialToken(token);
  const passwordHash = await bcrypt.hash(password, 12);

  // findOneAndUpdate makes the lookup-and-consume atomic, so two requests racing the same
  // token can't both pass a separate find() before either write lands (single-use guarantee).
  const user = await User.findOneAndUpdate(
    {
      credentialTokenHash: tokenHash,
      credentialTokenExpires: { $gt: new Date() },
      credentialTokenPurpose: { $in: ['invite', 'reset'] },
    },
    {
      $set: { passwordHash, status: 'active' },
      $unset: { credentialTokenHash: 1, credentialTokenExpires: 1, credentialTokenPurpose: 1 },
      $inc: { tokenVersion: 1 },
    },
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  res.json({ success: true, data: { message: 'Password set successfully.' } });
});
