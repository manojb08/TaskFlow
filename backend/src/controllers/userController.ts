import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { env } from '../config/env';
import { generateCredentialToken } from './authController';

const INVITE_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json({ success: true, data: { users } });
});

export const inviteUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body as { name: string; email: string; role?: 'admin' | 'member' };

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
  const { token, tokenHash } = generateCredentialToken();

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role ?? 'member',
    status: 'invited',
    credentialTokenHash: tokenHash,
    credentialTokenExpires: new Date(Date.now() + INVITE_TOKEN_EXPIRY_MS),
    credentialTokenPurpose: 'invite',
  });

  const inviteUrl = `${env.clientOrigin}/accept-invite?token=${token}`;

  res.status(201).json({ success: true, data: { user, inviteToken: token, inviteUrl } });
});

export const updateMe = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name } = req.body as { name: string };

  const user = await User.findByIdAndUpdate(req.user!.id, { name }, { new: true });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, data: { user } });
});
