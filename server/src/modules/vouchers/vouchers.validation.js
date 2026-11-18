import { z } from 'zod';

export const generateVouchersSchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  payment_date: z.string().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa_jazzcash']),
});
