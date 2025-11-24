import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/db.js';

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

export const handleSocketConnection = (socket, io) => {
  console.log('Client connected:', socket.id);

  // Admin joins - receives all orders from all sessions
  socket.on('joinAdmin', async (data) => {
    const { userType } = data;
    
    socket.join('admin-room');
    socket.userType = 'admin';
    
    console.log(`Socket ${socket.id} joined as admin`);
    
    socket.emit('joinedAdmin', { userType: 'admin' });
    
    // Send all current orders to admin
    try {
      const db = getDatabase();
      const orders = db.prepare(`
        SELECT * FROM orders 
        ORDER BY createdAt DESC 
        LIMIT 100
      `).all();
      
      const ordersWithItems = orders.map(order => getOrderWithItems(order.orderId));
      socket.emit('initialOrders', { orders: ordersWithItems });
    } catch (error) {
      console.error('Error fetching initial orders for admin:', error);
      socket.emit('initialOrders', { orders: [] });
    }
  });

  // Join session room (for customers or session-specific admin)
  socket.on('joinSession', async (data) => {
    const { sessionId, userType } = data; // userType: 'admin' or 'customer'
    
    if (!sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }

    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.userType = userType;
    
    console.log(`Socket ${socket.id} joined session ${sessionId} as ${userType}`);
    
    socket.emit('joinedSession', { sessionId, userType });
    
    // If admin joins specific session, send current orders for that session
    if (userType === 'admin') {
      try {
        const db = getDatabase();
        const orders = db.prepare(`
          SELECT * FROM orders 
          WHERE sessionId = ? 
          ORDER BY createdAt DESC
        `).all(sessionId);
        
        const ordersWithItems = orders.map(order => getOrderWithItems(order.orderId));
        socket.emit('initialOrders', { orders: ordersWithItems });
      } catch (error) {
        console.error('Error fetching initial orders:', error);
        socket.emit('initialOrders', { orders: [] });
      }
    }
  });

  // Customer events
  socket.on('orderPlaced', async (data) => {
    try {
      const { sessionId, items, customerNotes } = data;
      const orderId = uuidv4();
      const db = getDatabase();
      
      // Calculate total
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
      
      // Notify admin in the session room AND admin room (for global admin dashboard)
      io.to(sessionId).emit('newOrder', { order });
      io.to('admin-room').emit('newOrder', { order }); // Global admin dashboard
      
      // Confirm to customer
      socket.emit('orderConfirmed', { orderId, order });
      
    } catch (error) {
      console.error('Error handling orderPlaced:', error);
      socket.emit('error', { message: 'Failed to place order: ' + error.message });
    }
  });

  socket.on('buttonClicked', async (data) => {
    try {
      const { sessionId, buttonId, buttonLabel } = data;
      const db = getDatabase();
      const now = new Date().toISOString();
      
      // Save event
      db.prepare(`
        INSERT INTO events (sessionId, eventType, data, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(
        sessionId,
        'buttonClicked',
        JSON.stringify({ buttonId, buttonLabel }),
        now
      );
      
      // Notify admin in session room AND admin room
      io.to(sessionId).emit('customerEvent', {
        type: 'buttonClicked',
        buttonId,
        buttonLabel,
        timestamp: new Date()
      });
      io.to('admin-room').emit('customerEvent', {
        type: 'buttonClicked',
        buttonId,
        buttonLabel,
        sessionId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error handling buttonClicked:', error);
    }
  });

  socket.on('itemSelected', async (data) => {
    try {
      const { sessionId, itemId, itemName, selected } = data;
      const db = getDatabase();
      const now = new Date().toISOString();
      
      // Save event
      db.prepare(`
        INSERT INTO events (sessionId, eventType, data, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(
        sessionId,
        'itemSelected',
        JSON.stringify({ itemId, itemName, selected }),
        now
      );
      
      // Notify admin in session room AND admin room
      io.to(sessionId).emit('customerEvent', {
        type: 'itemSelected',
        itemId,
        itemName,
        selected,
        timestamp: new Date()
      });
      io.to('admin-room').emit('customerEvent', {
        type: 'itemSelected',
        itemId,
        itemName,
        selected,
        sessionId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error handling itemSelected:', error);
    }
  });

  socket.on('customerTyping', async (data) => {
    try {
      const { sessionId, isTyping } = data;
      
      // Notify admin (don't save typing events to DB)
      io.to(sessionId).emit('customerEvent', {
        type: 'customerTyping',
        isTyping,
        timestamp: new Date()
      });
      io.to('admin-room').emit('customerEvent', {
        type: 'customerTyping',
        isTyping,
        sessionId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error handling customerTyping:', error);
    }
  });

  // Admin events
  socket.on('updateOrderStatus', async (data) => {
    try {
      const { orderId, status, adminNotes } = data;
      const db = getDatabase();
      
      const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId);
      if (!order) {
        socket.emit('error', { message: `Order not found: ${orderId}` });
        return;
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
      
      // Notify customer in the session room
      io.to(order.sessionId).emit('statusUpdated', {
        orderId,
        status,
        adminNotes,
        order: updatedOrder
      });
      
      // Confirm to admin (both to sender and admin room)
      socket.emit('orderStatusUpdated', { orderId, status, order: updatedOrder });
      io.to('admin-room').emit('orderStatusUpdated', { orderId, status, order: updatedOrder });
      
    } catch (error) {
      console.error('Error handling updateOrderStatus:', error);
      socket.emit('error', { message: 'Failed to update order status: ' + error.message });
    }
  });

  socket.on('adminMessage', async (data) => {
    try {
      const { sessionId, message } = data;
      const db = getDatabase();
      const now = new Date().toISOString();
      
      // Save event
      db.prepare(`
        INSERT INTO events (sessionId, eventType, data, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(
        sessionId,
        'adminMessage',
        JSON.stringify({ message }),
        now
      );
      
      // Notify customer
      io.to(sessionId).emit('adminEvent', {
        type: 'adminMessage',
        message,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error handling adminMessage:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
};
