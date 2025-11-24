# 🚀 Complete Render Deployment Guide

This guide will walk you through deploying your Order System to Render and testing it live online.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **Git Repository** - Your project should be pushed to GitHub

---

## 🔧 Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is Committed

```bash
# Check git status
git status

# If you have uncommitted changes, commit them
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Update .gitignore (if needed)

Make sure these are in your `.gitignore`:
```
node_modules/
.env
.env.local
*.log
database.sqlite
.DS_Store
```

**Note:** The SQLite database file will be created automatically on Render.

---

## 🌐 Step 2: Deploy Backend to Render

### 2.1 Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository containing your project

### 2.2 Configure Backend Service

**Basic Settings:**
- **Name:** `order-system-backend` (or your preferred name)
- **Region:** Choose closest to you (e.g., `Oregon`, `Frankfurt`, `Singapore`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables:**
Click **"Advanced"** → **"Add Environment Variable"** and add:

```
NODE_ENV = production
PORT = 10000
FRONTEND_URL = https://your-frontend-url.onrender.com
```

**Important Notes:**
- Render assigns a random port via `PORT` environment variable
- The `FRONTEND_URL` will be set after deploying the frontend (Step 3)
- For now, you can use a placeholder or leave it empty

### 2.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://order-system-backend.onrender.com`

### 2.4 Update Environment Variables

After deployment, update the `FRONTEND_URL`:
1. Go to your service → **"Environment"** tab
2. Update `FRONTEND_URL` to your frontend URL (we'll get this in Step 3)

---

## 🎨 Step 3: Deploy Frontend (Static Files)

Since your frontend is static HTML files, you have two options:

### Option A: Deploy as Static Site (Recommended)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `order-system-frontend`
   - **Branch:** `main`
   - **Root Directory:** `/` (root of your repo)
   - **Build Command:** Leave empty (no build needed)
   - **Publish Directory:** `/` (root)

4. Click **"Create Static Site"**
5. You'll get a URL like: `https://order-system-frontend.onrender.com`

### Option B: Serve from Backend (Current Setup)

Your backend already serves static files. You can access:
- Admin: `https://your-backend-url.onrender.com/admin.html`
- Customer: `https://your-backend-url.onrender.com/customer.html?sessionId=...`

**Update Backend CORS:**
Make sure your backend allows your Render frontend URL in CORS settings.

---

## ⚙️ Step 4: Update Frontend URLs

### 4.1 Update API URLs in HTML Files

Since your frontend uses hardcoded `localhost:5000`, you need to update it for production.

**Option 1: Use Environment Detection (Recommended)**

Update `admin.html` and `customer.html`:

```javascript
// Replace this line:
const API_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';

// With this:
const API_URL = window.location.origin;
const SOCKET_URL = window.location.origin;
```

This automatically uses the current domain, whether localhost or Render.

**Option 2: Use Environment Variables**

If deploying as separate services, create a config:

```javascript
const API_URL = window.API_URL || window.location.origin;
const SOCKET_URL = window.SOCKET_URL || window.location.origin;
```

### 4.2 Update Backend CORS

Your backend already has permissive CORS for development. For production, update `backend/server.js`:

```javascript
// In the CORS configuration, add your Render frontend URL
const allowedOrigins = [
  'https://your-frontend-url.onrender.com',
  'https://your-backend-url.onrender.com',
  // Keep localhost for local development
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
```

---

## 🔐 Step 5: Configure Environment Variables

### Backend Environment Variables (Render Dashboard)

Go to your backend service → **"Environment"** tab:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Port (Render sets this automatically) |
| `FRONTEND_URL` | `https://your-frontend-url.onrender.com` | Frontend URL |

**Note:** Render automatically provides `PORT` via environment variable, so your server should use:
```javascript
const PORT = process.env.PORT || 5000;
```

---

## 🧪 Step 6: Test Your Live Deployment

### 6.1 Test Backend Health

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 6.2 Test API Endpoints

```bash
# Create a session
curl -X POST https://your-backend-url.onrender.com/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session","tableNumber":"1"}'

# Get menu
curl https://your-backend-url.onrender.com/api/menu

# Create menu item
curl -X POST https://your-backend-url.onrender.com/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Burger","price":9.99,"description":"Delicious burger"}'
```

### 6.3 Test Frontend

1. **Admin Panel:**
   - Open: `https://your-backend-url.onrender.com/admin.html`
   - Create a session
   - Add menu items
   - Verify orders appear

2. **Customer Page:**
   - Get session URL from admin panel
   - Open customer URL
   - Select items and place order
   - Verify order appears in admin panel

### 6.4 Test Real-time Features

1. Open admin panel in one browser tab
2. Open customer page in another tab
3. Place an order from customer page
4. Verify it appears instantly in admin panel
5. Update order status in admin panel
6. Verify customer page updates in real-time

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Go to Render Dashboard → Your Service → **"Logs"** tab
2. Look for error messages

**Common Issues:**
- **Port Error:** Make sure you're using `process.env.PORT`
- **Database Error:** SQLite should work on Render, but check file permissions
- **Module Not Found:** Verify all dependencies are in `package.json`

### CORS Errors

**Symptoms:** Browser console shows CORS errors

**Fix:**
1. Update CORS in `backend/server.js` to include your Render URLs
2. Make sure `FRONTEND_URL` environment variable is set correctly

### Socket.IO Connection Fails

**Symptoms:** Real-time features don't work

**Fix:**
1. Verify Socket.IO URL matches backend URL
2. Check that WebSocket is enabled (Render supports it)
3. Check browser console for connection errors

### Database Issues

**Symptoms:** Data not persisting

**Note:** Render's free tier has **ephemeral storage**. Your SQLite database will be reset when the service restarts.

**Solutions:**
1. **Upgrade to paid plan** for persistent storage
2. **Use external database** (PostgreSQL, MongoDB Atlas - free tiers available)
3. **Accept data loss** on restarts (for testing only)

### Static Files Not Loading

**Symptoms:** HTML/CSS/JS files return 404

**Fix:**
1. Verify `app.use(express.static(...))` in `server.js`
2. Check file paths are correct
3. Ensure files are committed to Git

---

## 📊 Step 7: Monitor Your Deployment

### 7.1 View Logs

1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Monitor for errors or issues

### 7.2 Check Metrics

Render provides:
- **CPU Usage**
- **Memory Usage**
- **Request Count**
- **Response Times**

### 7.3 Set Up Alerts (Optional)

1. Go to **"Settings"** → **"Alerts"**
2. Configure email alerts for:
   - Service down
   - High error rate
   - Resource limits

---

## 🔄 Step 8: Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. Make changes locally
2. Commit and push to GitHub
3. Render automatically detects changes
4. Builds and deploys new version
5. Your site updates automatically

**To disable auto-deploy:**
- Go to **"Settings"** → **"Build & Deploy"**
- Toggle **"Auto-Deploy"** off

---

## 🎯 Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend service created on Render
- [ ] Environment variables configured
- [ ] Backend deployed successfully
- [ ] Frontend URLs updated (if needed)
- [ ] CORS configured for production
- [ ] Health endpoint working
- [ ] API endpoints tested
- [ ] Admin panel accessible
- [ ] Customer page accessible
- [ ] Real-time features working
- [ ] Orders can be placed
- [ ] Order status updates work

---

## 📝 Production Considerations

### Security

1. **Add Authentication:**
   - Currently, menu endpoints are unprotected
   - Add admin authentication before production use

2. **Rate Limiting:**
   - Consider adding rate limiting to prevent abuse
   - Use `express-rate-limit` package

3. **Input Validation:**
   - Validate all user inputs
   - Sanitize data before database operations

### Performance

1. **Database:**
   - Consider migrating to PostgreSQL for production
   - Better performance and persistence

2. **Caching:**
   - Add Redis for session management
   - Cache frequently accessed data

3. **CDN:**
   - Use CDN for static assets
   - Improve load times globally

### Monitoring

1. **Error Tracking:**
   - Integrate Sentry or similar
   - Track errors in production

2. **Analytics:**
   - Add Google Analytics
   - Track user behavior

---

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://status.render.com)
- [Render Community](https://community.render.com)

---

## 💡 Tips

1. **Free Tier Limits:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading for always-on service

2. **Database Persistence:**
   - Free tier has ephemeral storage
   - Data resets on service restart
   - Use external database for production

3. **Custom Domain:**
   - Render allows custom domains
   - Go to **"Settings"** → **"Custom Domains"**
   - Add your domain and configure DNS

---

## ✅ Final Testing Steps

1. **Test from different devices:**
   - Desktop browser
   - Mobile browser
   - Different networks

2. **Test all features:**
   - Session creation
   - Menu management
   - Order placement
   - Status updates
   - Real-time updates

3. **Performance test:**
   - Load time
   - Response times
   - Concurrent users

---

**🎉 Congratulations! Your Order System is now live on Render!**

If you encounter any issues, check the troubleshooting section or Render's documentation.

