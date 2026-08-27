import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { validateRequest } from '../middleware/validateRequest';
import { inviteUserSchema, updateMeSchema } from '../validators/userValidators';

const router = Router();

router.get('/', requireAuth, userController.listUsers);
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateRequest({ body: inviteUserSchema }),
  userController.inviteUser,
);
router.patch('/me', requireAuth, validateRequest({ body: updateMeSchema }), userController.updateMe);

export default router;
