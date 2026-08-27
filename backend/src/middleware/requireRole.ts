import { NextFunction, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest } from './requireAuth';

export function requireRole(...roles: Array<'admin' | 'member'>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
