# QR Order System - Real-Time Order Management

A complete real-time web application for order management with bidirectional WebSocket communication between admin and customers.

## 🚀 Features

### Admin Side
- Create sessions/tables with unique URLs
- Generate QR codes for customer access
- Live dashboard with real-time order updates
- View all orders and customer events instantly
- Update order status (pending → accepted → preparing → ready → completed)
- No page refresh required - all updates are instant

### Customer Side
- Scan QR code to access order page
- Simple button-based ordering interface
- Real-time order status updates from admin
- See order confirmations and status changes instantly

### Real-Time Communication
- Bidirectional WebSocket communication using Socket.IO
- Customer → Admin: orders, button clicks, item selections
- Admin → Customer: status updates, messages
- All events saved to MongoDB
- Automatic room management per session

## 📁 Project Structure

```
qr/
├── backend/
│   ├── models/
│   │   ├── Session.js      # Session/Table model
│   │   ├── Order.js        # Order model
│   │   └── Event.js        # Event log model
│   ├── routes/
│   │   ├── sessions.js     # Session API endpoints
│   │   └── orders.js       # Order API endpoints
│   ├── socket/
│   │   └── socketHandler.js # Socket.IO event handlers
│   ├── server.js           # Main server file
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── admin/
    │   │   ├── page.js           # Admin dashboard
    │   │   └── sessions/
    │   │       └── page.js       # Session management
    │   ├── customer/
    │   │   └── [sessionId]/
    │   │       └── page.js       # Customer order page
    │   ├── page.js               # Home page
    │   ├── layout.js
    │   └── globals.css
    ├── lib/
    │   ├── socket.js             # Socket.IO client setup
    │   └── api.js                # API client functions
    ├── package.json
    ├── next.config.js
    └── tailwind.config.js
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB (MongoDB Atlas)
- **Deployment**: 
  - Frontend → Vercel
  - Backend → Render
  - Database → MongoDB Atlas

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🚀 Deployment

### Backend Deployment (Render)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: qr-order-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `PORT`: 5000 (or let Render assign)
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `FRONTEND_URL`: Your Vercel frontend URL (e.g., https://your-app.vercel.app)
     - `NODE_ENV`: production

6. Deploy!

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., https://qr-order-backend.onrender.com)
     - `NEXT_PUBLIC_SOCKET_URL`: Your Render backend URL (same as above)

6. Deploy!

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for Render)
5. Get connection string and update in Render environment variables

## 🧪 Testing Real-Time Features

### Test Customer → Admin Communication

1. Open admin dashboard: `http://localhost:3000/admin`
2. Create a new session
3. Open customer page in a new tab/browser
4. Click items or place an order
5. Watch admin dashboard update instantly (no refresh needed)

### Test Admin → Customer Communication

1. Open customer page
2. Place an order
3. In admin dashboard, change order status
4. Watch customer page update instantly

### Test Socket Events

Open browser console on both admin and customer pages to see:
- Connection status
- Real-time events
- Socket.IO messages

## 📡 Socket.IO Events

### Customer → Server
- `joinSession` - Join a session room
- `orderPlaced` - Place a new order
- `buttonClicked` - Button click event
- `itemSelected` - Item selection event
- `customerTyping` - Typing indicator

### Server → Admin
- `newOrder` - New order notification
- `customerEvent` - Customer interaction events
- `initialOrders` - Load existing orders on join

### Admin → Server
- `joinSession` - Join a session room
- `updateOrderStatus` - Update order status
- `adminMessage` - Send message to customer

### Server → Customer
- `statusUpdated` - Order status update
- `adminEvent` - Admin messages/events
- `orderConfirmed` - Order confirmation

## 🔧 Customization

### Menu Items

Edit `frontend/app/customer/[sessionId]/page.js` and modify the `MENU_ITEMS` array:

```javascript
const MENU_ITEMS = [
  { id: 1, name: 'Your Item', price: 10.99 },
  // Add more items...
];
```

### Order Statuses

Edit `backend/models/Order.js` to modify available statuses:

```javascript
status: {
  type: String,
  enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
  default: 'pending'
}
```

## 📝 API Endpoints

### Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/all` - Get all sessions
- `GET /api/sessions/:sessionId` - Get session by ID
- `PUT /api/sessions/:sessionId` - Update session
- `DELETE /api/sessions/:sessionId` - Delete session

### Orders
- `POST /api/orders/create` - Create new order
- `GET /api/orders/all` - Get all orders
- `GET /api/orders/session/:sessionId` - Get orders for session
- `GET /api/orders/:orderId` - Get order by ID
- `PUT /api/orders/:orderId/status` - Update order status
- `GET /api/orders/events/:sessionId` - Get events for session

## 🐛 Troubleshooting

### Socket connection issues
- Check CORS settings in `backend/server.js`
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check browser console for connection errors

### MongoDB connection issues
- Verify MongoDB Atlas IP whitelist includes Render IPs
- Check connection string format
- Ensure database user has proper permissions

### Real-time not working
- Check browser console for Socket.IO errors
- Verify both frontend and backend are running
- Check network tab for WebSocket connections

## 📄 License

ISC

## 🤝 Support

For issues or questions, please check the code comments or create an issue in your repository.

