import { Router } from 'express';
import { GroupController } from './group.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createGroupSchema, updateGroupSchema, inviteMemberSchema, joinGroupSchema } from './group.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(createGroupSchema), GroupController.createGroup);
router.get('/', GroupController.getUserGroups);
router.post('/join', validate(joinGroupSchema), GroupController.joinByCode);
router.get('/:id', GroupController.getGroupById);
router.put('/:id', validate(updateGroupSchema), GroupController.updateGroup);
router.delete('/:id', GroupController.deleteGroup);
router.post('/:id/invite', validate(inviteMemberSchema), GroupController.inviteMember);
router.delete('/:id/members/:memberId', GroupController.removeMember);
router.post('/:id/leave', GroupController.leaveGroup);

export default router;
