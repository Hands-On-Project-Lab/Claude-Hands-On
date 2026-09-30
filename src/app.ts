import express from 'express';
import { ordersRouter } from './routes/orders';

export const app = express();

app.use(express.json());
app.use('/api/orders', ordersRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
