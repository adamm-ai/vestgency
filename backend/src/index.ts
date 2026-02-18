import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import security validation
import { validateSecurityConfig } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import leadsRoutes from './routes/leads';
import propertiesRoutes from './routes/properties';
import statsRoutes from './routes/stats';
import notificationsRoutes from './routes/notifications';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  // Validate security configuration BEFORE starting
  try {
    validateSecurityConfig();
  } catch (error) {
    console.error('[SECURITY] ❌ Configuration invalide - Arrêt du serveur');
    console.error('[SECURITY]', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Start listening (so health check passes)
  app.listen(PORT, async () => {
    console.log(`[Server] Vestate API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Then connect to database
    try {
      await prisma.$connect();
      console.log('[Database] Connected to PostgreSQL');
    } catch (error) {
      console.error('[Database] Connection failed:', error);
      console.log('[Database] Will retry on first request...');
    }
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Server] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Server] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
