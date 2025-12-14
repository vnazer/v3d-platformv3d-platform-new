// V3D Platform - Express API Entry Point
// Production-ready server with middleware, error handling, and health checks

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes and middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/logging';
import projectsRouter from './routes/projects';
import leadsRouter from './routes/leads';
import usersRouter from './routes/users';
import healthRouter from './routes/health';

// Types
interface RequestWithId extends Request {
  id: string;
  userId?: string;
  orgId?: string;
}

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS - Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// COMPRESSION MIDDLEWARE
// ============================================

app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Balance between compression and CPU
}));

// ============================================
// REQUEST ID & LOGGING
// ============================================

// Attach unique request ID
app.use((req: RequestWithId, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Morgan HTTP request logger
const morganFormat = NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :req[id]'
  : 'dev';

app.use(morgan(morganFormat, {
  skip: (req: Request) => {
    // Skip health checks from logs (optional)
    return req.path === '/health';
  },
}));

// Custom request logger with structuring
app.use(requestLogger(LOG_LEVEL));

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Health check endpoint (used by ALB)
app.use('/health', healthRouter);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// JWT authentication middleware
app.use('/api', authMiddleware);

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/users', usersRouter);

// ============================================
// 404 & ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════════════╗
    ║        V3D Platform API Server Started         ║
    ║                                               ║
    ║  Port:       ${String(PORT).padEnd(39)} ║
    ║  Environment: ${NODE_ENV.padEnd(37)} ║
    ║  Log Level:  ${LOG_LEVEL.padEnd(38)} ║
    ╚═══════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// ============================================
// UNHANDLED ERRORS
// ============================================

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
