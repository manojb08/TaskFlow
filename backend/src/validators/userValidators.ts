import { z } from 'zod';

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email').toLowerCase(),
  role: z.enum(['admin', 'member']).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
});
