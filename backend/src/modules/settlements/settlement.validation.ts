import { z } from 'zod';

export const createSettlementSchema = z.object({
  fromUserId: z.string().min(1, 'Sender is required'),
  toUserId: z.string().min(1, 'Receiver is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  notes: z.string().max(255).optional(),
  settledAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});
