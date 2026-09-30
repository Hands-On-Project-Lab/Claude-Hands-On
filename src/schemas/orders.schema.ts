import { z } from 'zod';

export const CreateOrderSchema = z
  .object({
    customerId: z.string().min(1, 'Customer ID is required').max(255),
    amount: z.number().int().positive('Amount must be a positive integer in cents'),
    status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  })
  .strict();

export const UpdateOrderSchema = z
  .object({
    customerId: z.string().min(1).max(255).optional(),
    amount: z.number().int().positive().optional(),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  })
  .strict();

export const OrderParamsSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
});

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number().int(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
