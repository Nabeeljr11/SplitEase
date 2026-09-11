import { Router } from 'express';
import { BalanceController } from './balances.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/groups/:groupId/balances', BalanceController.getGroupBalances);

export default router;
