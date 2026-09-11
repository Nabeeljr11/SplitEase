import { Response } from 'express';
import { ExpenseService } from './expense.service';
import { AuthRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

export class ExpenseController {
  static async createExpense(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const expense = await ExpenseService.createExpense(
        groupId,
        req.user!.id,
        req.body
      );
      return sendSuccess(res, expense, 'Expense added successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to add expense', 400);
    }
  }

  static async getGroupExpenses(req: AuthRequest, res: Response) {
    try {
      const groupId = req.params.groupId as string;
      const result = await ExpenseService.getGroupExpenses(
        groupId,
        req.user!.id,
        req.query
      );
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch expenses', 400);
    }
  }

  static async getExpenseById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const expense = await ExpenseService.getExpenseById(id, req.user!.id);
      return sendSuccess(res, expense);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch expense', 400);
    }
  }

  static async updateExpense(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const expense = await ExpenseService.updateExpense(
        id,
        req.user!.id,
        req.body
      );
      return sendSuccess(res, expense, 'Expense updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update expense', 400);
    }
  }

  static async deleteExpense(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await ExpenseService.deleteExpense(id, req.user!.id);
      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete expense', 400);
    }
  }
}
