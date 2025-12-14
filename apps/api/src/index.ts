import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';
import leadsRoutes from './routes/leads';
import unitsRoutes from './routes/units';
import analyticsRoutes from './routes/analytics';
import currenciesRoutes from './routes/currencies';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000']
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'V3D Platform API',
    version: '1.0.0',
    description: 'Enterprise SaaS backend for real estate technology platform',
    endpoints: {
      health: '/health',
      info: '/api/info',
      auth: '/auth/*',
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'V3D Platform API',
    status: 'running',
    documentation: '/api/info'
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/currencies', currenciesRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log('');
  console.log('🚀 ════════════════════════════════════════════════════════');
  console.log('🚀  V3D Platform API Server');
  console.log('🚀 ════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   ✅ Server running on:     http://localhost:${port}`);
  console.log(`   ✅ Environment:           ${process.env.NODE_ENV}`);
  console.log(`   ✅ Health Check:          http://localhost:${port}/health`);
  console.log(`   ✅ API Info:              http://localhost:${port}/api/info`);
  console.log('');
  console.log('🔐 Auth Endpoints:');
  console.log(`   POST /auth/register`);
  console.log(`   POST /auth/login`);
  console.log(`   POST /auth/refresh`);
  console.log(`   GET  /auth/me`);
  console.log(`   POST /auth/logout`);
  console.log('');
  console.log('🚀 ════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

