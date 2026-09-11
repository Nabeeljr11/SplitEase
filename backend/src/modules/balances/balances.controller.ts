import { Response } from 'express';
import { BalanceService } from './balances.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class BalanceController {
  static async getGroupBalances(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const balances = await BalanceService.getGroupBalances(groupId, req.user!.id);
      return sendSuccess(res, balances);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to calculate balances', 400);
    }
  }
}
