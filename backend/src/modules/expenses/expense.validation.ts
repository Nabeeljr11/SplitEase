import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.enum(['FOOD', 'TRAVEL', 'RENT', 'UTILITIES', 'ENTERTAINMENT', 'OTHER']).default('OTHER'),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).default('EQUAL'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  paidById: z.string().min(1, 'Payer is required'),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        value: z.number().nonnegative().optional(),
      })
    )
    .min(1, 'At least one participant must be included in split'),
});

export const updateExpenseSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  category: z.enum(['FOOD', 'TRAVEL', 'RENT', 'UTILITIES', 'ENTERTAINMENT', 'OTHER']).optional(),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  paidById: z.string().min(1).optional(),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        value: z.number().nonnegative().optional(),
      })
    )
    .optional(),
});
