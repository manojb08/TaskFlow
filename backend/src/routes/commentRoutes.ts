import { Router } from 'express';
import * as commentController from '../controllers/commentController';
import { requireAuth } from '../middleware/requireAuth';
import { validateRequest } from '../middleware/validateRequest';
import { commentIdParamsSchema } from '../validators/commentValidators';

const router = Router();

router.use(requireAuth);

router.delete(
  '/:commentId',
  validateRequest({ params: commentIdParamsSchema }),
  commentController.deleteComment,
);

export default router;
