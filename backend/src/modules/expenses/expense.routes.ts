import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from './expense.validation';

const router = Router();

router.use(authenticate);

// Group-scoped expense routes
router.post('/groups/:groupId/expenses', validate(createExpenseSchema), ExpenseController.createExpense);
router.get('/groups/:groupId/expenses', ExpenseController.getGroupExpenses);

// Expense-specific routes
router.get('/expenses/:id', ExpenseController.getExpenseById);
router.put('/expenses/:id', validate(updateExpenseSchema), ExpenseController.updateExpense);
router.delete('/expenses/:id', ExpenseController.deleteExpense);

export default router;
