# Menu Management Feature - Deployment Checklist

## ✅ Implementation Complete

All menu management features have been implemented:

1. ✅ Database schema updated with `menu` table
2. ✅ REST API endpoints (GET, POST, DELETE)
3. ✅ Socket.IO broadcast for menu updates
4. ✅ Customer UI updated to fetch menu from server
5. ✅ Admin UI already has menu management (from previous update)

## 🚀 Deployment Steps

### 1. Restart Backend Server

```bash
cd backend
npm start
```

**Or if using nodemon:**
```bash
cd backend
npm run dev
```

### 2. Verify Database Migration

The `menu` table will be created automatically on server start. Check the console for:
```
✅ SQLite database initialized successfully
```

### 3. Test Endpoints

See `MENU_API_TEST_COMMANDS.md` for detailed test commands.

**Quick test:**
```bash
# Create a product
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Burger","price":12.99,"available":true}'

# Get all products
curl 'http://localhost:5000/api/menu'
```

### 4. Test Socket.IO Broadcast

1. Start socket listener:
   ```bash
   cd backend
   node test-socket-menu.js
   ```

2. In another terminal, create/delete a product via REST API

3. Verify `menuUpdated` event is received

### 5. Test Customer UI

1. Open `customer.html?sessionId=<session-id>` in browser
2. Verify menu loads from server
3. Create/delete a product via admin UI
4. Verify customer menu updates automatically

## 📋 One-Line Deployment Command

```bash
cd backend && npm start
```

## 🔍 Verification Checklist

- [ ] Backend server starts without errors
- [ ] Database table `menu` is created
- [ ] GET /api/menu returns empty array initially
- [ ] POST /api/menu creates a product successfully
- [ ] DELETE /api/menu/:id deletes a product
- [ ] Socket.IO broadcasts `menuUpdated` on create/delete
- [ ] Customer UI loads menu from server
- [ ] Customer UI updates when menu changes
- [ ] Admin UI can create/delete products
- [ ] Orders can be placed with menu items

## 🐛 Troubleshooting

### Database errors
- Check that `database.sqlite` file is writable
- Verify SQLite is properly installed: `npm list better-sqlite3`

### Socket.IO not broadcasting
- Verify Socket.IO instance is passed to menu routes
- Check server console for connection logs
- Test with `test-socket-menu.js` script

### Customer UI not loading menu
- Check browser console for errors
- Verify backend is running on port 5000
- Check CORS settings in `server.js`
- Verify `/api/menu?available=true` endpoint works

### Menu not updating in real-time
- Verify Socket.IO connection is established
- Check browser console for `menuUpdated` events
- Ensure `socket.on('menuUpdated')` handler is registered

## 📝 Notes

- **Authentication**: Currently, menu endpoints are not protected. TODO comments are added where auth middleware should be added.
- **Database**: SQLite database file is at `backend/database.sqlite`
- **Port**: Backend runs on port 5000 by default (configurable via `PORT` env var)

