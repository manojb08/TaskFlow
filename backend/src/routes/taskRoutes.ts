import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import * as commentController from '../controllers/commentController';
import * as activityController from '../controllers/activityController';
import { requireAuth } from '../middleware/requireAuth';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from '../validators/taskValidators';
import { createCommentSchema, listCommentsQuerySchema } from '../validators/commentValidators';

const router = Router();

router.use(requireAuth);

router.get('/', validateRequest({ query: listTasksQuerySchema }), taskController.listTasks);
router.post('/', validateRequest({ body: createTaskSchema }), taskController.createTask);
router.get('/stats/summary', taskController.getTaskStats);
router.get('/:id', validateRequest({ params: taskIdParamsSchema }), taskController.getTask);
router.patch(
  '/:id',
  validateRequest({ params: taskIdParamsSchema, body: updateTaskSchema }),
  taskController.updateTask,
);
router.delete('/:id', validateRequest({ params: taskIdParamsSchema }), taskController.deleteTask);

router.get(
  '/:id/comments',
  validateRequest({ params: taskIdParamsSchema, query: listCommentsQuerySchema }),
  commentController.listComments,
);
router.post(
  '/:id/comments',
  validateRequest({ params: taskIdParamsSchema, body: createCommentSchema }),
  commentController.createComment,
);

router.get(
  '/:id/activity',
  validateRequest({ params: taskIdParamsSchema }),
  activityController.listActivity,
);

export default router;
