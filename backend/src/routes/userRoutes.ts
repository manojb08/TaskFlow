import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', requireAuth, userController.listUsers);

export default router;
