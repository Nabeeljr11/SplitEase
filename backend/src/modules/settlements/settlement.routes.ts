import { Router } from 'express';
import { SettlementController } from './settlement.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSettlementSchema } from './settlement.validation';

const router = Router();

router.use(authenticate);

router.post('/groups/:groupId/settlements', validate(createSettlementSchema), SettlementController.createSettlement);
router.get('/groups/:groupId/settlements', SettlementController.getGroupSettlements);
router.delete('/settlements/:id', SettlementController.deleteSettlement);

export default router;
