import { Order, CreateOrderInput, UpdateOrderInput } from '../schemas/orders.schema';

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  create(data: CreateOrderInput): Promise<Order>;
  update(id: string, data: UpdateOrderInput): Promise<Order | null>;
  delete(id: string): Promise<boolean>;
}

let orders = new Map<string, Order>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export const orderRepository: IOrderRepository = {
  async findAll() {
    return Array.from(orders.values());
  },

  async findById(id: string) {
    const order = orders.get(id);
    return order ? { ...order } : null;
  },

  async create(data: CreateOrderInput) {
    const id = generateId();
    const now = new Date();
    const order: Order = {
      id,
      customerId: data.customerId,
      amount: data.amount,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    orders.set(id, order);
    return { ...order };
  },

  async update(id: string, data: UpdateOrderInput) {
    const existing = orders.get(id);
    if (!existing) return null;

    const updated: Order = {
      ...existing,
      customerId: data.customerId ?? existing.customerId,
      amount: data.amount ?? existing.amount,
      status: data.status ?? existing.status,
      updatedAt: new Date(),
    };
    orders.set(id, updated);
    return { ...updated };
  },

  async delete(id: string) {
    return orders.delete(id);
  },
};

export function resetOrderStore(): void {
  orders = new Map();
}
