import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/db.js';

const router = express.Router();

// Socket.IO instance (will be set from server.js)
let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * GET /api/menu
 * Returns all menu items, optionally filtered by availability
 * Query params: ?available=true to only return available items
 */
router.get('/', async (req, res) => {
  try {
    const { available } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM menu ORDER BY name ASC';
    let params = [];
    
    if (available === 'true') {
      query = 'SELECT * FROM menu WHERE available = 1 ORDER BY name ASC';
    }
    
    const products = db.prepare(query).all(...params);
    
    // Convert SQLite INTEGER to boolean for available field
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      description: product.description || null,
      available: product.available === 1
    }));
    
    res.json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/menu
 * Creates a new menu item
 * Body: { name, price?, description?, available? }
 * TODO: Add authentication middleware to restrict to admin/manager
 */
router.post('/', async (req, res) => {
  try {
    const { name, price, description, available } = req.body;
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name is required and must be a non-empty string' 
      });
    }
    
    const priceNum = price !== undefined ? parseFloat(price) : 0;
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Price must be a number >= 0' 
      });
    }
    
    const availableBool = available !== undefined ? Boolean(available) : true;
    const now = new Date().toISOString();
    const productId = uuidv4();
    
    const db = getDatabase();
    
    // Insert product into database
    db.prepare(`
      INSERT INTO menu (id, name, price, description, available, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      name.trim(),
      priceNum,
      description ? description.trim() : null,
      availableBool ? 1 : 0,
      now,
      now
    );
    
    // Fetch the created product
    const product = db.prepare('SELECT * FROM menu WHERE id = ?').get(productId);
    
    const formattedProduct = {
      id: product.id,
      name: product.name,
      price: product.price || 0,
      description: product.description || null,
      available: product.available === 1
    };
    
    // Broadcast menu update to all connected clients
    if (ioInstance) {
      ioInstance.emit('menuUpdated', {
        action: 'create',
        productId: productId,
        product: formattedProduct
      });
    }
    
    res.status(201).json({ success: true, product: formattedProduct });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/menu/:id
 * Deletes a menu item by ID
 * TODO: Add authentication middleware to restrict to admin/manager
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Product ID is required' 
      });
    }
    
    const db = getDatabase();
    
    // Check if product exists
    const product = db.prepare('SELECT * FROM menu WHERE id = ?').get(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    // Delete product
    db.prepare('DELETE FROM menu WHERE id = ?').run(id);
    
    // Broadcast menu update to all connected clients
    if (ioInstance) {
      ioInstance.emit('menuUpdated', {
        action: 'delete',
        productId: id
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

