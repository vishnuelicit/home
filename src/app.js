import express from 'express';
import authRoutes from './routes/auth.routes.js';
import boardRoutes from './routes/boards.routes.js';

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/boards', boardRoutes);

app.get('/health', (_, res) =>
  res.json({ success: true, status: 'OK' })
);

export default app;
