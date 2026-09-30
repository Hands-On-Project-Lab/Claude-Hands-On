import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Orders API', () => {
  describe('GET /api/orders', () => {
    it('should return an empty array initially', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const newOrder = {
        customerId: 'cust-123',
        amount: 99.99,
        status: 'pending',
      };
      const res = await request(app).post('/api/orders').send(newOrder);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.customerId).toBe('cust-123');
      expect(res.body.amount).toBe(99.99);
      expect(res.body.status).toBe('pending');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('should reject invalid order data', async () => {
      const invalidOrder = {
        customerId: 'cust-123',
        amount: -10,
      };
      const res = await request(app).post('/api/orders').send(invalidOrder);

      expect(res.status).toBe(400);
      expect(res.body).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const incompleteOrder = {
        customerId: 'cust-123',
      };
      const res = await request(app).post('/api/orders').send(incompleteOrder);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app).get('/api/orders/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .put('/api/orders/nonexistent')
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app).delete('/api/orders/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('should return health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
});
