import { AppError } from '../errors/app-error';
import { IOrderRepository } from '../repositories/orders.repository';
import { Order, CreateOrderInput, UpdateOrderInput } from '../schemas/orders.schema';

export class OrderService {
  constructor(private repository: IOrderRepository) {}

  async getAllOrders(): Promise<Order[]> {
    return this.repository.findAll();
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }
    return order;
  }

  async createOrder(data: CreateOrderInput): Promise<Order> {
    return this.repository.create(data);
  }

  async updateOrder(id: string, data: UpdateOrderInput): Promise<Order> {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }
    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }
  }
}
