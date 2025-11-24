# Quick Start Guide

Get your QR Order System up and running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Git

## Local Development Setup

### 1. Clone/Download the Project
```bash
cd qr
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend
npm install
```

Create `.env` file:
```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Mac/Linux
cp env.example .env
```

Edit `.env` and add your MongoDB connection string:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-orders?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

You should see: `Server running on port 5000` and `MongoDB connected successfully`

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
```

Create `.env.local` file:
```bash
# Windows (PowerShell)
Copy-Item env.example .env.local

# Mac/Linux
cp env.example .env.local
```

The `.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

You should see: `Ready on http://localhost:3000`

### 4. Test the Application

1. **Open Admin Dashboard**
   - Go to: http://localhost:3000
   - Click "Admin Dashboard"

2. **Create a Session**
   - Click "Manage Sessions" or go to: http://localhost:3000/admin/sessions
   - Click "Create Session"
   - Enter a name (e.g., "Table 5")
   - Click "Create Session"
   - Click "Show QR" to see the QR code

3. **Test Customer Side**
   - Click "Open Link" or copy the customer URL
   - Open in a new browser tab/window (or incognito)
   - You should see the customer ordering page

4. **Test Real-Time Communication**
   - In customer page: Click on menu items, add to cart, place order
   - In admin dashboard: Watch orders appear instantly!
   - In admin dashboard: Change order status
   - In customer page: Watch status update instantly!

## Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access admin dashboard
- [ ] Can create a session
- [ ] QR code is generated
- [ ] Can open customer page
- [ ] Can place an order
- [ ] Admin sees order instantly (no refresh)
- [ ] Admin can update order status
- [ ] Customer sees status update instantly

## Common Issues

**Backend won't start:**
- Check MongoDB connection string in `.env`
- Make sure MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0)
- Check if port 5000 is already in use

**Frontend won't start:**
- Make sure backend is running first
- Check `.env.local` file exists and has correct values
- Try deleting `.next` folder and running `npm run dev` again

**Socket.IO not connecting:**
- Check browser console for errors
- Verify both frontend and backend are running
- Check CORS settings in `backend/server.js`

**Orders not appearing:**
- Check browser console for errors
- Verify Socket.IO connection (should see "Connected" in admin dashboard)
- Check MongoDB connection in backend logs

## Next Steps

- Customize menu items in `frontend/app/customer/[sessionId]/page.js`
- Add authentication if needed
- Deploy to production (see DEPLOYMENT.md)
- Customize styling and branding

## Need Help?

- Check the main README.md for detailed documentation
- Check DEPLOYMENT.md for production deployment
- Review code comments in the source files

