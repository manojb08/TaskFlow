import { ActivityLog } from '../models/ActivityLog';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const listActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id).select('_id');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const activity = await ActivityLog.find({ task: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', 'name');

  res.json({ success: true, data: { activity } });
});
