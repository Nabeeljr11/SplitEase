import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from './user.validation';

const router = Router();

router.use(authenticate);

router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), UserController.changePassword);
router.get('/search', UserController.searchUsers);

export default router;
