# QR Order System - Complete Project Scan Report

## 1) Project Summary

This is a real-time Point-of-Sale (POS) web application for restaurant/table service order management. The system enables restaurants to create table sessions with QR codes that customers can scan to place orders directly from their mobile devices. **Admin users** can create table sessions, generate QR codes, view all incoming orders in real-time, and update order statuses (pending → accepted → preparing → ready → completed). **Customer users** scan QR codes to access a menu interface, select items, place orders, and receive real-time status updates. The application uses WebSocket (Socket.IO) for bidirectional real-time communication between admin and customer interfaces, with all data persisted in SQLite. The frontend consists of two standalone HTML files (admin.html and customer.html) that can be opened directly in browsers, while the backend is a Node.js/Express server with Socket.IO.

## 2) Architecture & Component Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Static HTML)                    │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  admin.html  │              │ customer.html│            │
│  │  (CDN deps)  │              │  (CDN deps)  │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                    │
│         └──────────┬───────────────────┘                    │
│                    │ HTTP REST + WebSocket                  │
└────────────────────┼────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Backend (Node.js/Express)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  server.js (Express + Socket.IO)                     │  │
│  │  - Port: 5000                                        │  │
│  │  - CORS enabled                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ routes/      │  │ socket/      │  │ utils/       │    │
│  │ - orders.js  │  │ - socket     │  │ - db.js      │    │
│  │ - sessions.js│  │   Handler.js │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Database (SQLite)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  database.sqlite                                     │  │
│  │  - sessions table                                    │  │
│  │  - orders table                                      │  │
│  │  - order_items table                                 │  │
│  │  - events table                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Major Directories:**
- `backend/` - Node.js Express server with Socket.IO
  - `routes/` - REST API endpoints (orders, sessions)
  - `socket/` - WebSocket event handlers
  - `utils/` - Database utilities (SQLite connection)
  - `models/` - Legacy Mongoose models (unused, project migrated to SQLite)
- `frontend/` - Legacy Next.js app (unused, replaced by HTML files)
- Root: `admin.html`, `customer.html` - Standalone frontend files

**Third-party Integrations:**
- Socket.IO (WebSocket communication)
- QRCode library (QR code generation)
- Tailwind CSS (via CDN)
- No payment gateways, email services, or external APIs

## 3) How to Run Locally

### Prerequisites
- Node.js 18+ installed
- No database setup required (SQLite file auto-created)

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env if needed (defaults work for local dev)
npm start
# OR for development with auto-reload:
npm run dev
```

### Frontend Setup
**No build step required!** Simply:
1. Double-click `admin.html` to open admin panel
2. Double-click `customer.html?sessionId=XXX` for customer view (after creating a session)

### Quick Start Commands
```bash
# Terminal 1 - Backend
cd backend && npm start

# Browser
# Open admin.html directly (file:///path/to/admin.html)
# OR serve via simple HTTP server:
# python -m http.server 8000
# Then visit: http://localhost:8000/admin.html
```

**Access Points:**
- Backend API: `http://localhost:5000`
- Backend Health: `http://localhost:5000/health`
- Admin UI: Open `admin.html` in browser (file:// or via HTTP server)
- Customer UI: Open `customer.html?sessionId=YOUR_SESSION_ID`

**Note:** The HTML files use hardcoded `http://localhost:5000` for API calls. For production, update the `API_URL` and `SOCKET_URL` constants in both HTML files.

## 4) Environment Variables & Config

**File:** `backend/.env` (create from `backend/env.example`)

| Variable | Example Value | Required | Notes |
|----------|---------------|----------|-------|
| `PORT` | `5000` | No | Defaults to 5000 |
| `FRONTEND_URL` | `http://localhost:3000` | No | Used for QR code generation |
| `NODE_ENV` | `development` | No | Environment mode |

**No secrets required** - This is an open system with no authentication.

**Frontend Configuration:**
- Hardcoded in HTML files: `const API_URL = 'http://localhost:5000'`
- Hardcoded in HTML files: `const SOCKET_URL = 'http://localhost:5000'`
- **Action Required:** Update these constants in `admin.html` and `customer.html` for production deployment.

## 5) API Inventory

### REST Endpoints

| Method | Path | Auth | Description | Request Body | Response |
|--------|------|------|-------------|--------------|----------|
| `GET` | `/` | None | API info | - | `{message, status, endpoints, timestamp}` |
| `GET` | `/health` | None | Health check | - | `{status: "ok", timestamp}` |
| `GET` | `/api/sessions/all` | None | List all sessions | - | `{success: true, sessions: [...]}` |
| `GET` | `/api/sessions/:sessionId` | None | Get session by ID | - | `{success: true, session: {...}}` |
| `POST` | `/api/sessions/create` | None | Create new session | `{name, tableNumber?}` | `{success: true, session: {...}}` |
| `PUT` | `/api/sessions/:sessionId` | None | Update session | `{name?, tableNumber?, isActive?}` | `{success: true, session: {...}}` |
| `DELETE` | `/api/sessions/:sessionId` | None | Delete session | - | `{success: true, message}` |
| `GET` | `/api/orders/all` | None | Get all orders (admin) | - | `{success: true, orders: [...]}` |
| `GET` | `/api/orders/session/:sessionId` | None | Get orders for session | - | `{success: true, orders: [...]}` |
| `GET` | `/api/orders/:orderId` | None | Get order by ID | - | `{success: true, order: {...}}` |
| `POST` | `/api/orders/create` | None | Create new order | `{sessionId, items: [{itemName, quantity, price}], customerNotes?}` | `{success: true, order: {...}}` |
| `PUT` | `/api/orders/:orderId/status` | None | Update order status | `{status, adminNotes?}` | `{success: true, order: {...}}` |
| `GET` | `/api/orders/events/:sessionId` | None | Get events for session | - | `{success: true, events: [...]}` |

**⚠️ CRITICAL:** All endpoints are **publicly accessible with no authentication**. Anyone can create/update/delete sessions and orders.

### WebSocket Events (Socket.IO)

**Client → Server:**
- `joinAdmin` - Admin joins admin room
- `joinSession` - Join a session room (admin or customer)
- `orderPlaced` - Customer places order
- `buttonClicked` - Customer clicks menu item
- `itemSelected` - Customer selects/deselects item
- `customerTyping` - Customer typing indicator
- `updateOrderStatus` - Admin updates order status
- `adminMessage` - Admin sends message to customer

**Server → Client:**
- `joinedAdmin` - Confirmation of admin join
- `joinedSession` - Confirmation of session join
- `newOrder` - New order notification (to admin)
- `orderConfirmed` - Order confirmation (to customer)
- `statusUpdated` - Order status update (to customer)
- `orderStatusUpdated` - Order status update (to admin)
- `customerEvent` - Customer interaction events (to admin)
- `adminEvent` - Admin messages/events (to customer)
- `initialOrders` - Initial orders on join (to admin)
- `error` - Error messages

## 6) Database Schema & Queries

**Database Type:** SQLite (better-sqlite3)

**Schema:**

```sql
-- Sessions (tables/QR codes)
CREATE TABLE sessions (
  sessionId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tableNumber TEXT,
  qrCodeUrl TEXT,
  isActive INTEGER DEFAULT 1,
  customerUrl TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Orders
CREATE TABLE orders (
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

-- Order Items
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT NOT NULL,
  itemName TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  FOREIGN KEY (orderId) REFERENCES orders(orderId) ON DELETE CASCADE
);

-- Events (audit log)
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId TEXT NOT NULL,
  eventType TEXT NOT NULL,
  orderId TEXT,
  data TEXT,  -- JSON string
  timestamp TEXT NOT NULL,
  FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

-- Indexes
CREATE INDEX idx_orders_sessionId ON orders(sessionId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_events_sessionId ON events(sessionId);
CREATE INDEX idx_events_timestamp ON events(timestamp);
```

**Key Queries:**
- Order creation uses parameterized queries (safe from SQL injection)
- Order retrieval joins orders with order_items via helper function
- Events table stores JSON data as TEXT (requires JSON.parse on read)
- Foreign keys enabled with CASCADE delete on order_items

**Transaction Usage:** None - each operation is atomic but not wrapped in explicit transactions.

## 7) Authentication & Sessions

**⚠️ CRITICAL SECURITY ISSUE:** **No authentication or authorization implemented.**

- No JWT tokens
- No session management
- No password protection
- No role-based access control
- All API endpoints are publicly accessible
- Anyone can create/delete sessions, update orders, etc.

**Socket.IO "Rooms":**
- Uses Socket.IO rooms for message routing (`admin-room`, `sessionId` rooms)
- No authentication - anyone can join any room by emitting `joinAdmin` or `joinSession`
- Room membership is based on client-side claims only

**Remediation Required:**
- Implement authentication middleware
- Add JWT or session-based auth
- Protect admin endpoints
- Verify socket room membership server-side

## 8) Frontend Overview

**Framework:** Vanilla JavaScript (no framework)
- Two standalone HTML files using CDN resources
- Tailwind CSS via CDN for styling
- Socket.IO client via CDN
- QRCode.js via CDN

**State Management:** 
- Local JavaScript variables and DOM manipulation
- No state management library

**Key Pages/Components:**

**admin.html:**
- Tabbed interface (Dashboard / Sessions)
- Dashboard: Real-time orders list, live events feed, order status updates
- Sessions: Create sessions, generate QR codes, list all sessions
- Socket.IO connection for real-time updates

**customer.html:**
- Menu display with item selection
- Order summary with quantity controls
- Order status display
- Special instructions textarea
- Socket.IO connection for real-time status updates
- Requires `?sessionId=XXX` URL parameter

**Forms & Validation:**
- Session creation form (name, tableNumber) - basic HTML5 required validation
- Order placement - client-side validation (checks for selected items)
- No server-side input validation
- No XSS protection on user inputs

## 9) Tests & CI

**Tests:** None found
- No test files (Jest, Mocha, etc.)
- No test scripts in package.json
- No CI/CD configuration (GitHub Actions, GitLab CI, etc.)

**Recommendation:** Add unit tests for:
- Order creation logic
- Status update logic
- Database operations
- Socket event handlers

## 10) Third-Party Services & Integrations

**None** - This is a self-contained application:
- No payment gateways
- No email services
- No SMS/notifications
- No cloud storage
- No analytics
- No external APIs

**CDN Dependencies (Frontend):**
- Tailwind CSS (cdn.tailwindcss.com)
- Socket.IO Client (cdn.socket.io)
- QRCode.js (cdn.jsdelivr.net)

## 11) Security & Common Pitfalls

### Critical Issues

1. **No Authentication/Authorization**
   - **Location:** All routes in `backend/routes/*.js`
   - **Issue:** Anyone can create/delete sessions, update orders
   - **Fix:** Add authentication middleware, protect admin endpoints

2. **SQL Injection Risk (Low - Parameterized Queries Used)**
   - **Location:** `backend/routes/sessions.js:151-155` (dynamic UPDATE query)
   - **Issue:** Dynamic query building with string concatenation
   - **Current:** Uses parameterized values, but query structure is dynamic
   - **Fix:** Use explicit field updates or whitelist allowed fields

3. **XSS Vulnerability**
   - **Location:** `admin.html`, `customer.html` - all user input displayed without sanitization
   - **Issue:** User input (session names, notes, item names) rendered directly in HTML
   - **Fix:** Sanitize all user inputs before rendering (use DOMPurify or similar)

4. **CORS Misconfiguration**
   - **Location:** `backend/server.js:24-27`
   - **Issue:** CORS allows any origin matching `FRONTEND_URL` (defaults to localhost:3000)
   - **Fix:** Restrict CORS to specific origins in production

5. **No Input Validation**
   - **Location:** All POST/PUT endpoints
   - **Issue:** No validation on request body (e.g., negative prices, empty items array)
   - **Fix:** Add validation middleware (express-validator, joi)

6. **Socket.IO No Authentication**
   - **Location:** `backend/socket/socketHandler.js`
   - **Issue:** Anyone can join admin room or any session room
   - **Fix:** Verify socket authentication before allowing room joins

7. **Sensitive Data in Logs**
   - **Location:** Console.log statements throughout
   - **Issue:** Order data, session IDs logged to console
   - **Fix:** Use proper logging library with log levels

8. **No Rate Limiting**
   - **Location:** All endpoints
   - **Issue:** Vulnerable to DoS attacks
   - **Fix:** Add rate limiting middleware (express-rate-limit)

## 12) Reliability & Concurrency Risks

### Race Conditions

1. **Order Creation Race Condition**
   - **Location:** `backend/socket/socketHandler.js:90-149`, `backend/routes/orders.js:91-150`
   - **Issue:** Multiple simultaneous order placements could cause duplicate orders or inconsistent state
   - **Current:** No transaction wrapping, no locking
   - **Fix:** Wrap order creation in database transaction

2. **Status Update Race Condition**
   - **Location:** `backend/socket/socketHandler.js:251-301`, `backend/routes/orders.js:153-208`
   - **Issue:** Concurrent status updates could overwrite each other
   - **Fix:** Use optimistic locking (version field) or SELECT FOR UPDATE

3. **No Database Transactions**
   - **Location:** All database operations
   - **Issue:** Order creation inserts into multiple tables without transaction
   - **Fix:** Wrap multi-table operations in transactions:
   ```javascript
   const transaction = db.transaction(() => {
     // Insert order
     // Insert items
     // Insert event
   });
   transaction();
   ```

4. **SQLite Write Concurrency**
   - **Issue:** SQLite handles concurrent writes poorly
   - **Fix:** Enable WAL mode: `db.pragma('journal_mode = WAL')`

## 13) Performance Hotspots

1. **N+1 Query Problem**
   - **Location:** `backend/routes/orders.js:15-30` (getOrderWithItems)
   - **Issue:** Fetches order, then fetches items separately for each order
   - **Fix:** Use JOIN query:
   ```sql
   SELECT o.*, json_group_array(json_object('itemName', oi.itemName, 'quantity', oi.quantity, 'price', oi.price)) as items
   FROM orders o
   LEFT JOIN order_items oi ON o.orderId = oi.orderId
   GROUP BY o.orderId
   ```

2. **Missing Pagination**
   - **Location:** `backend/routes/orders.js:54-71` (GET /all)
   - **Issue:** Hard limit of 100, but no offset/pagination
   - **Fix:** Add pagination with LIMIT/OFFSET

3. **Events Table Growth**
   - **Location:** `backend/routes/orders.js:211-233`
   - **Issue:** Events table grows indefinitely, no cleanup
   - **Fix:** Add archival/cleanup job or partition by date

4. **No Query Result Caching**
   - **Issue:** Sessions list fetched on every request
   - **Fix:** Add Redis or in-memory cache with TTL

5. **Missing Indexes**
   - **Current indexes are good, but consider:**
   - Index on `orders.createdAt` for time-based queries
   - Composite index on `(sessionId, createdAt)` for session order queries

## 14) UX / Accessibility Quick Wins

1. **Touch Targets Too Small**
   - **Location:** `customer.html` - menu item buttons
   - **Issue:** Buttons may be too small for touch devices
   - **Fix:** Increase min-height to 48px, add more padding

2. **No Keyboard Navigation**
   - **Issue:** Cannot navigate menu with keyboard
   - **Fix:** Add tabindex, keyboard event handlers

3. **No Loading States on Actions**
   - **Location:** Order status updates
   - **Fix:** Add visual feedback during API calls

4. **No Error Messages for Users**
   - **Location:** All error handling
   - **Issue:** Errors only logged to console
   - **Fix:** Display user-friendly error messages

5. **No Offline Support**
   - **Issue:** App breaks if backend is down
   - **Fix:** Add service worker, offline queue

6. **Mobile Responsiveness**
   - **Current:** Uses Tailwind responsive classes
   - **Status:** Generally good, but test on actual devices

## 15) TODOs and Prioritized Next Actions

### Critical (Security)
1. **Implement authentication** - Add JWT or session-based auth for admin endpoints
2. **Add input validation** - Validate all API inputs (express-validator)
3. **Sanitize user inputs** - Prevent XSS attacks (DOMPurify)
4. **Protect Socket.IO** - Authenticate socket connections before room joins
5. **Add rate limiting** - Prevent DoS attacks

### High Priority (Reliability)
6. **Add database transactions** - Wrap multi-table operations
7. **Fix race conditions** - Add locking for concurrent order updates
8. **Enable SQLite WAL mode** - Better concurrent write performance
9. **Add error handling** - Proper error responses, user-friendly messages
10. **Add logging** - Replace console.log with proper logging library

### Medium Priority (Performance)
11. **Fix N+1 queries** - Use JOINs for order items
12. **Add pagination** - For orders and events lists
13. **Add caching** - Cache sessions list, frequently accessed data
14. **Optimize queries** - Add missing indexes

### Nice-to-Have (Features)
15. **Add tests** - Unit and integration tests
16. **Add CI/CD** - Automated testing and deployment
17. **Improve UX** - Better loading states, error messages
18. **Add offline support** - Service worker, offline queue
19. **Add analytics** - Track order metrics, popular items

## 16) Patch Mode - Critical Fixes

### Fix 1: Add Input Validation

**File:** `backend/routes/orders.js`

```diff
--- a/backend/routes/orders.js
+++ b/backend/routes/orders.js
@@ -1,6 +1,7 @@
 import express from 'express';
 import { v4 as uuidv4 } from 'uuid';
 import { getDatabase } from '../utils/db.js';
+import { body, validationResult } from 'express-validator';
 
 const router = express.Router();
 
@@ -90,7 +91,20 @@
 });
 
 // Create a new order
-router.post('/create', async (req, res) => {
+router.post('/create', [
+  body('sessionId').notEmpty().isString(),
+  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
+  body('items.*.itemName').notEmpty().isString(),
+  body('items.*.quantity').isInt({ min: 1 }),
+  body('items.*.price').isFloat({ min: 0 }),
+  body('customerNotes').optional().isString().isLength({ max: 500 })
+], async (req, res) => {
+  const errors = validationResult(req);
+  if (!errors.isEmpty()) {
+    return res.status(400).json({ success: false, error: errors.array() });
+  }
+  
   try {
     const { sessionId, items, customerNotes } = req.body;
```

**Install:** `npm install express-validator`

### Fix 2: Sanitize User Input (XSS Prevention)

**File:** `admin.html` and `customer.html`

Add DOMPurify library and sanitize all user-generated content:

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

Then in JavaScript:
```javascript
// Replace all innerHTML assignments with:
element.innerHTML = DOMPurify.sanitize(userInput);
```

### Fix 3: Add Database Transactions

**File:** `backend/socket/socketHandler.js`

```diff
--- a/backend/socket/socketHandler.js
+++ b/backend/socket/socketHandler.js
@@ -100,6 +100,8 @@
       const now = new Date().toISOString();
       
+      const transaction = db.transaction(() => {
       // Insert order
       db.prepare(`
         INSERT INTO orders (orderId, sessionId, status, totalAmount, customerNotes, createdAt, updatedAt)
@@ -123,6 +125,8 @@
         JSON.stringify({ orderId, items, totalAmount }),
         now
       );
+      });
+      transaction();
       
       const order = getOrderWithItems(orderId);
```

## 17) Machine-Readable Output

```json
{
  "projectName": "QR Order System",
  "language": "JavaScript (Node.js)",
  "backendPorts": [5000],
  "frontendPorts": [],
  "dbType": "SQLite",
  "envVars": [
    {
      "name": "PORT",
      "required": false,
      "default": "5000",
      "description": "Backend server port"
    },
    {
      "name": "FRONTEND_URL",
      "required": false,
      "default": "http://localhost:3000",
      "description": "Frontend URL for QR code generation"
    },
    {
      "name": "NODE_ENV",
      "required": false,
      "default": "development",
      "description": "Environment mode"
    }
  ],
  "endpoints": [
    {"method": "GET", "path": "/", "auth": false, "description": "API info"},
    {"method": "GET", "path": "/health", "auth": false, "description": "Health check"},
    {"method": "GET", "path": "/api/sessions/all", "auth": false, "description": "List all sessions"},
    {"method": "GET", "path": "/api/sessions/:sessionId", "auth": false, "description": "Get session by ID"},
    {"method": "POST", "path": "/api/sessions/create", "auth": false, "description": "Create new session"},
    {"method": "PUT", "path": "/api/sessions/:sessionId", "auth": false, "description": "Update session"},
    {"method": "DELETE", "path": "/api/sessions/:sessionId", "auth": false, "description": "Delete session"},
    {"method": "GET", "path": "/api/orders/all", "auth": false, "description": "Get all orders (admin)"},
    {"method": "GET", "path": "/api/orders/session/:sessionId", "auth": false, "description": "Get orders for session"},
    {"method": "GET", "path": "/api/orders/:orderId", "auth": false, "description": "Get order by ID"},
    {"method": "POST", "path": "/api/orders/create", "auth": false, "description": "Create new order"},
    {"method": "PUT", "path": "/api/orders/:orderId/status", "auth": false, "description": "Update order status"},
    {"method": "GET", "path": "/api/orders/events/:sessionId", "auth": false, "description": "Get events for session"}
  ],
  "mainIssues": [
    {
      "severity": "critical",
      "type": "security",
      "issue": "No authentication/authorization",
      "location": "All routes",
      "impact": "Anyone can modify data"
    },
    {
      "severity": "critical",
      "type": "security",
      "issue": "XSS vulnerability",
      "location": "admin.html, customer.html",
      "impact": "User input rendered without sanitization"
    },
    {
      "severity": "high",
      "type": "reliability",
      "issue": "No database transactions",
      "location": "Order creation, status updates",
      "impact": "Data inconsistency risk"
    },
    {
      "severity": "high",
      "type": "reliability",
      "issue": "Race conditions",
      "location": "Concurrent order operations",
      "impact": "Data corruption possible"
    },
    {
      "severity": "medium",
      "type": "performance",
      "issue": "N+1 query problem",
      "location": "getOrderWithItems function",
      "impact": "Slow order retrieval"
    }
  ],
  "suggestedFixes": [
    {
      "priority": 1,
      "fix": "Implement authentication middleware",
      "files": ["backend/routes/orders.js", "backend/routes/sessions.js"],
      "effort": "high"
    },
    {
      "priority": 2,
      "fix": "Add input validation",
      "files": ["backend/routes/orders.js", "backend/routes/sessions.js"],
      "effort": "medium"
    },
    {
      "priority": 3,
      "fix": "Sanitize user inputs (XSS)",
      "files": ["admin.html", "customer.html"],
      "effort": "low"
    },
    {
      "priority": 4,
      "fix": "Add database transactions",
      "files": ["backend/socket/socketHandler.js", "backend/routes/orders.js"],
      "effort": "medium"
    },
    {
      "priority": 5,
      "fix": "Fix N+1 queries with JOINs",
      "files": ["backend/routes/orders.js"],
      "effort": "low"
    }
  ]
}
```

```yaml
# project-manifest.yaml
project:
  name: QR Order System
  type: web-application
  stack:
    backend: Node.js/Express
    frontend: Vanilla HTML/JS
    database: SQLite

commands:
  run:
    backend: "cd backend && npm start"
    dev: "cd backend && npm run dev"
  test: "echo 'No tests configured'"
  lint: "echo 'No linter configured'"
  build: "echo 'No build step required'"

dependencies:
  backend:
    - express
    - socket.io
    - better-sqlite3
    - qrcode
    - uuid
  frontend:
    - tailwindcss (CDN)
    - socket.io-client (CDN)
    - qrcode.js (CDN)

ports:
  backend: 5000
  frontend: null

database:
  type: SQLite
  file: backend/database.sqlite
  migrations: false
```

---

## Missing Items & Ambiguities

1. **No .env file** - Create from `backend/env.example`
2. **Legacy models/** - Contains unused Mongoose models (can be deleted)
3. **Legacy frontend/** - Contains unused Next.js app (can be deleted)
4. **No deployment config** - `render.yaml` exists but may be outdated
5. **No API documentation** - Consider adding OpenAPI/Swagger spec

## Commands for Deeper Analysis

```bash
# Check for hardcoded secrets
grep -r "password\|secret\|key\|token" backend/ --exclude-dir=node_modules

# Check for SQL injection patterns
grep -r "db.prepare\|db.exec" backend/ --exclude-dir=node_modules

# Check for console.log (sensitive data)
grep -r "console.log" backend/ --exclude-dir=node_modules

# Analyze database file
sqlite3 backend/database.sqlite ".schema"
sqlite3 backend/database.sqlite "SELECT COUNT(*) FROM orders;"
```

---

**Report Generated:** 2025-11-23
**Scan Type:** Full Repository Reconnaissance
**Files Analyzed:** 20+ core files
**Issues Found:** 8 critical, 5 high, 4 medium priority

