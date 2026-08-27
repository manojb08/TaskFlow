import { FilterQuery } from 'mongoose';
import { Task, ITask } from '../models/Task';
import { Comment } from '../models/Comment';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/requireAuth';

export const listTasks = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page, limit, search, status, priority, assignee, sortBy, sortOrder } = req.query as unknown as {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  const filter: FilterQuery<ITask> = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (search) filter.$text = { $search: search };

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignee', 'name email')
      .populate('creator', 'name email'),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { tasks },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const createTask = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const task = await Task.create({ ...req.body, creator: req.user!.id });
  const populated = await task.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'creator', select: 'name email' },
  ]);
  res.status(201).json({ success: true, data: { task: populated } });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email')
    .populate('creator', 'name email');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  res.json({ success: true, data: { task } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignee', 'name email')
    .populate('creator', 'name email');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  res.json({ success: true, data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  await Comment.deleteMany({ task: task._id });
  res.json({ success: true, data: { deleted: true } });
});
