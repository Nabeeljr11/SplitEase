import { Response } from 'express';
import { GroupService } from './group.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class GroupController {
  static async createGroup(req: AuthRequest, res: Response) {
    try {
      const group = await GroupService.createGroup(req.user!.id, req.body);
      return sendSuccess(res, group, 'Group created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create group', 400);
    }
  }

  static async getUserGroups(req: AuthRequest, res: Response) {
    try {
      const groups = await GroupService.getUserGroups(req.user!.id);
      return sendSuccess(res, groups);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch groups', 400);
    }
  }

  static async getGroupById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const group = await GroupService.getGroupById(id, req.user!.id);
      return sendSuccess(res, group);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch group', 400);
    }
  }

  static async updateGroup(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const group = await GroupService.updateGroup(id, req.user!.id, req.body);
      return sendSuccess(res, group, 'Group updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update group', 400);
    }
  }

  static async deleteGroup(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await GroupService.deleteGroup(id, req.user!.id);
      return sendSuccess(res, result, 'Group deleted');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete group', 400);
    }
  }

  static async inviteMember(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const member = await GroupService.inviteMemberByEmail(id, req.user!.id, req.body.email);
      return sendSuccess(res, member, 'Member invited successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to invite member', 400);
    }
  }

  static async joinByCode(req: AuthRequest, res: Response) {
    try {
      const result = await GroupService.joinGroupByInviteCode(req.user!.id, req.body.inviteCode);
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to join group', 400);
    }
  }

  static async removeMember(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const memberId = req.params.memberId as string;
      const result = await GroupService.removeMember(id, req.user!.id, memberId);
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to remove member', 400);
    }
  }

  static async leaveGroup(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await GroupService.leaveGroup(id, req.user!.id);
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to leave group', 400);
    }
  }
}
