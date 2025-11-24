# Menu API Test Commands

## Prerequisites
1. Start the backend server: `cd backend && npm start`
2. Wait for server to be ready (check http://localhost:5000/health)

## REST API Tests

### 1. Create a Product (POST)
```bash
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Veg Burger",
    "price": 3.50,
    "description": "Delicious vegetarian burger",
    "available": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "product": {
    "id": "uuid-here",
    "name": "Veg Burger",
    "price": 3.5,
    "description": "Delicious vegetarian burger",
    "available": true
  }
}
```

### 2. Get All Products (GET)
```bash
curl 'http://localhost:5000/api/menu'
```

**Expected Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid-here",
      "name": "Veg Burger",
      "price": 3.5,
      "description": "Delicious vegetarian burger",
      "available": true
    }
  ]
}
```

### 3. Get Only Available Products
```bash
curl 'http://localhost:5000/api/menu?available=true'
```

### 4. Delete a Product (DELETE)
```bash
# Replace <product-id> with actual ID from step 1
curl -X DELETE 'http://localhost:5000/api/menu/<product-id>'
```

**Expected Response:**
```json
{
  "success": true
}
```

### 5. Create Multiple Products for Testing
```bash
# Create product 1
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Pizza","price":15.99,"description":"Large pizza","available":true}'

# Create product 2
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Pasta","price":11.99,"description":"Spaghetti","available":true}'

# Create unavailable product
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sold Out Item","price":5.99,"available":false}'
```

### 6. Validation Tests

**Missing name (should return 400):**
```bash
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"price":10.99}'
```

**Negative price (should return 400):**
```bash
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","price":-5}'
```

**Delete non-existent product (should return 404):**
```bash
curl -X DELETE 'http://localhost:5000/api/menu/00000000-0000-0000-0000-000000000000'
```

## Socket.IO Tests

### Test Menu Broadcast

1. **Start Socket.IO listener:**
   ```bash
   cd backend
   node test-socket-menu.js
   ```

2. **In another terminal, create a product:**
   ```bash
   curl -X POST 'http://localhost:5000/api/menu' \
     -H 'Content-Type: application/json' \
     -d '{"name":"Test Item","price":9.99,"available":true}'
   ```

3. **You should see the `menuUpdated` event in the socket listener terminal**

4. **Delete the product:**
   ```bash
   curl -X DELETE 'http://localhost:5000/api/menu/<product-id>'
   ```

5. **You should see another `menuUpdated` event**

## Automated Test Script

Run the automated test suite:
```bash
cd backend
node test-menu-api.js
```

This will:
- Create a product
- Verify it appears in GET /api/menu
- Test available filter
- Delete the product
- Verify deletion
- Test validation errors

## Customer Order Test

### 1. Create a Session
```bash
curl -X POST 'http://localhost:5000/api/sessions/create' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Table 5","tableNumber":"5"}'
```

### 2. Create Products (if not already created)
```bash
curl -X POST 'http://localhost:5000/api/menu' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Burger","price":12.99,"available":true}'
```

### 3. Place an Order
```bash
# Replace <session-id> with actual session ID from step 1
curl -X POST 'http://localhost:5000/api/orders/create' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "<session-id>",
    "items": [
      {
        "itemName": "Burger",
        "quantity": 2,
        "price": 12.99
      }
    ],
    "customerNotes": "No onions please"
  }'
```

## Integration Test Flow

1. **Start backend:** `cd backend && npm start`
2. **Open admin.html** in browser
3. **Go to Menu tab** and create a product
4. **Open customer.html?sessionId=<session-id>** in another tab
5. **Verify menu loads** from server
6. **Select items** and place order
7. **In admin.html**, verify order appears in Dashboard
8. **Delete a product** from Menu tab
9. **In customer.html**, verify menu updates automatically (via Socket.IO)

