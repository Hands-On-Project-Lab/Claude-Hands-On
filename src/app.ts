import express from 'express';
import helmet from 'helmet';
import { ordersRouter } from './routes/orders.routes';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.disable('x-powered-by');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/orders', ordersRouter);

app.use(errorHandler);
