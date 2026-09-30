import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const OrderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string(),
  amount: z.number().positive(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
  createdAt: z.date().optional(),
});

type Order = z.infer<typeof OrderSchema>;

const orders: Map<string, Order> = new Map();

router.get('/', (req: Request, res: Response) => {
  const orderList = Array.from(orders.values());
  res.json(orderList);
});

router.get('/:id', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

router.post('/', (req: Request, res: Response) => {
  try {
    const validated = OrderSchema.parse(req.body);
    const id = Math.random().toString(36).substring(7);
    const order: Order = {
      ...validated,
      id,
      createdAt: new Date(),
    };
    orders.set(id, order);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const order = orders.get(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const validated = OrderSchema.parse({ ...order, ...req.body });
    orders.set(req.params.id, validated);
    res.json(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  orders.delete(req.params.id);
  res.json({ message: 'Order deleted' });
});

export { router as ordersRouter };
