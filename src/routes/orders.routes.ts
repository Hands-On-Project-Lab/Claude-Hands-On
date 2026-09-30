import { Router, Request, Response } from 'express';
import { OrderService } from '../services/orders.service';
import { orderRepository } from '../repositories/orders.repository';
import { CreateOrderSchema, UpdateOrderSchema, OrderParamsSchema } from '../schemas/orders.schema';
import { asyncHandler } from '../middleware/async-handler';
import { validate, validateParams } from '../middleware/validate';

const router = Router();
const orderService = new OrderService(orderRepository);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.getAllOrders();
    res.json({ data: orders });
  }),
);

router.get(
  '/:id',
  validateParams(OrderParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await orderService.getOrderById(id);
    res.json(order);
  }),
);

router.post(
  '/',
  validate(CreateOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  }),
);

router.put(
  '/:id',
  validateParams(OrderParamsSchema),
  validate(UpdateOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await orderService.updateOrder(id, req.body);
    res.json(order);
  }),
);

router.delete(
  '/:id',
  validateParams(OrderParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await orderService.deleteOrder(id);
    res.status(204).send();
  }),
);

export { router as ordersRouter };
