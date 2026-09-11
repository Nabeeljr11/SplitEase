import { Response } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class UserController {
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserService.updateProfile(req.user!.id, req.body);
      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update profile', 400);
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to change password', 400);
    }
  }

  static async searchUsers(req: AuthRequest, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      const users = await UserService.searchUsers(query, req.user!.id);
      return sendSuccess(res, users);
    } catch (error: any) {
      return sendError(res, error.message || 'Search failed', 400);
    }
  }
}
