import { Response } from 'express';
import { NotificationService } from './notification.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const data = await NotificationService.getUserNotifications(req.user!.id);
      return sendSuccess(res, data);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch notifications', 400);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await NotificationService.markAsRead(id, req.user!.id);
      return sendSuccess(res, updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to mark notification as read', 400);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to mark all notifications as read', 400);
    }
  }
}
