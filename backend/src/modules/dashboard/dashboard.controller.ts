import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class DashboardController {
  static async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await DashboardService.getSummary(req.user!.id);
      return sendSuccess(res, summary);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch dashboard summary', 400);
    }
  }
}
