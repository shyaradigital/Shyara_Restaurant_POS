import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/db.js';

const router = express.Router();

// Create a new session
router.post('/create', async (req, res) => {
  try {
    const { name, tableNumber } = req.body;
    const sessionId = uuidv4();
    const db = getDatabase();
    
    // Generate customer URL
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const customerUrl = `${frontendUrl}/customer.html?sessionId=${sessionId}`;
    
    const now = new Date().toISOString();
    
    // Insert session into database
    db.prepare(`
      INSERT INTO sessions (sessionId, name, tableNumber, qrCodeUrl, isActive, customerUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      name || `Session ${sessionId.substring(0, 8)}`,
      tableNumber || null,
      null, // qrCodeUrl - no longer generated
      1,
      customerUrl,
      now,
      now
    );
    
    const session = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);
    
    res.json({
      success: true,
      session: {
        ...session,
        isActive: session.isActive === 1
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all sessions
router.get('/all', async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const db = getDatabase();
    
    const sessions = db.prepare(`
      SELECT * FROM sessions 
      ORDER BY createdAt DESC
    `).all();
    
    const sessionsWithUrls = sessions.map(session => {
      // Always use correct URL format (fix old URLs)
      const customerUrl = `${frontendUrl}/customer.html?sessionId=${session.sessionId}`;
      return {
        ...session,
        isActive: session.isActive === 1,
        customerUrl: customerUrl
      };
    });
    
    res.json({ success: true, sessions: sessionsWithUrls });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const db = getDatabase();
    
    const session = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session: {
        ...session,
        isActive: session.isActive === 1,
        customerUrl: `${frontendUrl}/customer.html?sessionId=${sessionId}`
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session
router.put('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, tableNumber, isActive } = req.body;
    const db = getDatabase();
    
    const session = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const now = new Date().toISOString();
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (tableNumber !== undefined) {
      updates.push('tableNumber = ?');
      values.push(tableNumber);
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive ? 1 : 0);
    }
    
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(sessionId);
    
    db.prepare(`
      UPDATE sessions 
      SET ${updates.join(', ')}
      WHERE sessionId = ?
    `).run(...values);
    
    const updatedSession = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);
    
    res.json({
      success: true,
      session: {
        ...updatedSession,
        isActive: updatedSession.isActive === 1
      }
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete session
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const db = getDatabase();
    
    const session = db.prepare('SELECT * FROM sessions WHERE sessionId = ?').get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Delete session (cascade will delete related orders and events)
    db.prepare('DELETE FROM sessions WHERE sessionId = ?').run(sessionId);
    
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
