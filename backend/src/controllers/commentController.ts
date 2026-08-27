import { Comment } from '../models/Comment';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { broadcast } from '../realtime/io';

export const listComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query as unknown as { page: number; limit: number };

  const task = await Task.findById(id).select('_id');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find({ task: id }).sort({ createdAt: 1 }).skip(skip).limit(limit).populate('author', 'name email'),
    Comment.countDocuments({ task: id }),
  ]);

  res.json({
    success: true,
    data: { comments },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const createComment = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const task = await Task.findById(id).select('_id');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const comment = await Comment.create({ task: id, author: req.user!.id, body: req.body.body });
  const populated = await comment.populate('author', 'name email');
  broadcast('comment:created', { taskId: id, commentId: comment._id });
  res.status(201).json({ success: true, data: { comment: populated } });
});

export const deleteComment = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  const isAuthor = comment.author.toString() === req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  if (!isAuthor && !isAdmin) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  await comment.deleteOne();
  broadcast('comment:deleted', { taskId: comment.task, commentId: comment._id });
  res.json({ success: true, data: { deleted: true } });
});
