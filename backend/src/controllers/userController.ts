import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json({ success: true, data: { users } });
});
