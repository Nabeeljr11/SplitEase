import { Response } from 'express';
import { SettlementService } from './settlement.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class SettlementController {
  static async createSettlement(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const settlement = await SettlementService.createSettlement(
        groupId,
        req.user!.id,
        req.body
      );
      return sendSuccess(res, settlement, 'Settlement recorded successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to record settlement', 400);
    }
  }

  static async getGroupSettlements(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const settlements = await SettlementService.getGroupSettlements(
        groupId,
        req.user!.id
      );
      return sendSuccess(res, settlements);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch settlements', 400);
    }
  }

  static async deleteSettlement(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await SettlementService.deleteSettlement(
        id,
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete settlement', 400);
    }
  }
}
