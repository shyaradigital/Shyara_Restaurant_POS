import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './utils/db.js';
import sessionRoutes from './routes/sessions.js';
import orderRoutes, { setSocketIO as setOrderSocketIO } from './routes/orders.js';
import menuRoutes, { setSocketIO as setMenuSocketIO } from './routes/menu.js';
import { handleSocketConnection } from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or file://)
      if (!origin) return callback(null, true);
      // Allow localhost and file:// origins (for local development)
      if (origin.startsWith('http://localhost') || 
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('file://') ||
          origin === 'null') {
        return callback(null, true);
      }
      // Allow Render URLs (for production)
      if (origin.includes('.onrender.com')) {
        return callback(null, true);
      }
      // Allow configured frontend URL
      const allowedOrigin = process.env.FRONTEND_URL;
      if (allowedOrigin && origin === allowedOrigin) {
        return callback(null, true);
      }
      // In production, be more restrictive; in development, allow all
      if (process.env.NODE_ENV === 'production') {
        callback(null, true); // Allow all for now, tighten later if needed
      } else {
        callback(null, true); // Allow all origins for development
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or file://)
    if (!origin) return callback(null, true);
    // Allow localhost and file:// origins (for local development)
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('file://') ||
        origin === 'null') {
      return callback(null, true);
    }
    // Allow Render URLs (for production)
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    // Allow configured frontend URL
    const allowedOrigin = process.env.FRONTEND_URL;
    if (allowedOrigin && origin === allowedOrigin) {
      return callback(null, true);
    }
    // In production, be more restrictive; in development, allow all
    if (process.env.NODE_ENV === 'production') {
      callback(null, true); // Allow all for now, tighten later if needed
    } else {
      callback(null, true); // Allow all origins for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static HTML files from project root
app.use(express.static(path.join(__dirname, '..')));

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - browser will use default
});

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Order System Backend API',
    status: 'running',
    endpoints: {
      health: '/health',
      sessions: '/api/sessions',
      orders: '/api/orders',
      menu: '/api/menu'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Pass socket.io instance to routes
setOrderSocketIO(io);
setMenuSocketIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  handleSocketConnection(socket, io);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// SQLite database initialization
try {
  initDatabase();
  console.log('✅ SQLite database connected successfully');
} catch (error) {
  console.error('❌ SQLite database initialization error:', error.message);
  console.warn('⚠️  Server will continue running but database features will not work.');
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Order System Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('='.repeat(50));
});

