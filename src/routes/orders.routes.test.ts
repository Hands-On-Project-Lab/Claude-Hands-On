import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { resetOrderStore } from '../repositories/orders.repository';

describe('Orders API', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  describe('GET /api/orders', () => {
    it('should return empty list initially', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [] });
    });

    it('should return all orders', async () => {
      await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      await request(app).post('/api/orders').send({
        customerId: 'cust2',
        amount: 2000,
      });

      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('createdAt');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by id', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      const id = createRes.body.id;
      const res = await request(app).get(`/api/orders/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.customerId).toBe('cust1');
      expect(res.body.amount).toBe(1000);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app).get('/api/orders/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with required fields', async () => {
      const res = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.customerId).toBe('cust1');
      expect(res.body.amount).toBe(1000);
      expect(res.body.status).toBe('pending');
      expect(res.body.createdAt).toBeDefined();
    });

    it('should create order with optional status', async () => {
      const res = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
        status: 'completed',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('completed');
    });

    it('should return 400 for missing customerId', async () => {
      const res = await request(app).post('/api/orders').send({
        amount: 1000,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative amount', async () => {
      const res = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: -100,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for unknown fields', async () => {
      const res = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
        unknownField: 'value',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
        status: 'invalid',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order with partial data', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      const id = createRes.body.id;
      const res = await request(app).put(`/api/orders/${id}`).send({
        status: 'completed',
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.status).toBe('completed');
      expect(res.body.customerId).toBe('cust1');
      expect(res.body.amount).toBe(1000);
    });

    it('should update all fields', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      const id = createRes.body.id;
      const res = await request(app).put(`/api/orders/${id}`).send({
        customerId: 'cust2',
        amount: 2000,
        status: 'cancelled',
      });

      expect(res.status).toBe(200);
      expect(res.body.customerId).toBe('cust2');
      expect(res.body.amount).toBe(2000);
      expect(res.body.status).toBe('cancelled');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app).put('/api/orders/nonexistent').send({
        status: 'completed',
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should return 400 for invalid status', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      const id = createRes.body.id;
      const res = await request(app).put(`/api/orders/${id}`).send({
        status: 'invalid',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete order', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerId: 'cust1',
        amount: 1000,
      });

      const id = createRes.body.id;
      const deleteRes = await request(app).delete(`/api/orders/${id}`);
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app).get(`/api/orders/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app).delete('/api/orders/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });
});
