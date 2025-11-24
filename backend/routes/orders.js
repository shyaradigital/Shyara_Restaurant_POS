import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/db.js';

const router = express.Router();

// Socket.IO instance (will be set from server.js)
let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

// Helper function to get order with items
const getOrderWithItems = (orderId) => {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId);
  if (!order) return null;
  
  const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderId);
  return {
    ...order,
    items: items.map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes || ''
    }))
  };
};

// Get all orders for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const db = getDatabase();
    
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE sessionId = ? 
      ORDER BY createdAt DESC
    `).all(sessionId);
    
    const ordersWithItems = orders.map(order => getOrderWithItems(order.orderId));
    
    res.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all orders (admin view)
router.get('/all', async (req, res) => {
  try {
    const db = getDatabase();
    
    const orders = db.prepare(`
      SELECT * FROM orders 
      ORDER BY createdAt DESC 
      LIMIT 100
    `).all();
    
    const ordersWithItems = orders.map(order => getOrderWithItems(order.orderId));
    
    res.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order by ID
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = getOrderWithItems(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new order
router.post('/create', async (req, res) => {
  try {
    const { sessionId, items, customerNotes } = req.body;
    const orderId = uuidv4();
    const db = getDatabase();
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
    
    const now = new Date().toISOString();
    
    // Insert order
    db.prepare(`
      INSERT INTO orders (orderId, sessionId, status, totalAmount, customerNotes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, sessionId, 'pending', totalAmount, customerNotes || '', now, now);
    
    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, itemName, quantity, price, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      insertItem.run(
        orderId,
        item.itemName,
        item.quantity || 1,
        item.price || 0,
        item.notes || ''
      );
    }
    
    // Save event
    db.prepare(`
      INSERT INTO events (sessionId, eventType, orderId, data, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      sessionId,
      'orderPlaced',
      orderId,
      JSON.stringify({ orderId, items, totalAmount }),
      now
    );
    
    const order = getOrderWithItems(orderId);
    
    // Emit socket event to notify admin
    if (ioInstance) {
      ioInstance.to('admin-room').emit('newOrder', { order });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;
    const db = getDatabase();
    
    const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    const now = new Date().toISOString();
    
    // Update order
    db.prepare(`
      UPDATE orders 
      SET status = ?, adminNotes = ?, updatedAt = ?
      WHERE orderId = ?
    `).run(status, adminNotes || order.adminNotes || '', now, orderId);
    
    // Save event
    db.prepare(`
      INSERT INTO events (sessionId, eventType, orderId, data, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      order.sessionId,
      'updateOrderStatus',
      orderId,
      JSON.stringify({ status, adminNotes }),
      now
    );
    
    const updatedOrder = getOrderWithItems(orderId);
    
    // Emit socket event to notify customer and admin
    if (ioInstance) {
      ioInstance.to(order.sessionId).emit('statusUpdated', {
        orderId,
        status,
        adminNotes,
        order: updatedOrder
      });
      
      ioInstance.to('admin-room').emit('orderStatusUpdated', {
        orderId,
        status,
        order: updatedOrder
      });
    }
    
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get events for a session
router.get('/events/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const db = getDatabase();
    
    const events = db.prepare(`
      SELECT * FROM events 
      WHERE sessionId = ? 
      ORDER BY timestamp DESC 
      LIMIT 100
    `).all(sessionId);
    
    const formattedEvents = events.map(event => ({
      ...event,
      data: event.data ? JSON.parse(event.data) : {}
    }));
    
    res.json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { setSocketIO };
export default router;
