# ⚡ Quick Start: Deploy to Render in 5 Minutes

## 🚀 Fastest Deployment Method

### Step 1: Push to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Deploy Backend

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `order-system-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (leave empty for now, update after deployment)
6. Click **"Create Web Service"**
7. Wait for deployment (2-5 minutes)
8. Copy your backend URL (e.g., `https://order-system-backend.onrender.com`)

### Step 3: Access Your Application

Your application is now live! Access it at:

- **Admin Panel:** `https://your-backend-url.onrender.com/admin.html`
- **Customer Page:** `https://your-backend-url.onrender.com/customer.html?sessionId=...`

### Step 4: Test

1. Open admin panel
2. Create a session
3. Add menu items
4. Open customer URL
5. Place an order
6. Verify it appears in admin panel

## ✅ Done!

Your Order System is now live on Render!

**Note:** On free tier, services spin down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds to wake up.

## 🔧 Need More Details?

See `RENDER_DEPLOYMENT_GUIDE.md` for comprehensive instructions.

