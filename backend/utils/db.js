import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

// Create database instance
let db = null;

/**
 * Initialize the database connection and create tables
 */
export const initDatabase = () => {
  try {
    db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sessionId TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tableNumber TEXT,
        qrCodeUrl TEXT,
        isActive INTEGER DEFAULT 1,
        customerUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        orderId TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        totalAmount REAL DEFAULT 0,
        customerNotes TEXT DEFAULT '',
        adminNotes TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        itemName TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        price REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        FOREIGN KEY (orderId) REFERENCES orders(orderId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId TEXT NOT NULL,
        eventType TEXT NOT NULL,
        orderId TEXT,
        data TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
      );

      CREATE TABLE IF NOT EXISTS menu (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        description TEXT,
        available INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_orders_sessionId ON orders(sessionId);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_events_sessionId ON events(sessionId);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_menu_available ON menu(available);
    `);
    
    console.log('✅ SQLite database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    return initDatabase();
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};

export default getDatabase;

