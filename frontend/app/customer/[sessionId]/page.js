'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSocket } from '../../../lib/socket';
import { getSession, createOrder } from '../../../lib/api';

// Sample menu items - you can customize this
const MENU_ITEMS = [
  { id: 1, name: 'Burger', price: 12.99 },
  { id: 2, name: 'Pizza', price: 15.99 },
  { id: 3, name: 'Pasta', price: 11.99 },
  { id: 4, name: 'Salad', price: 8.99 },
  { id: 5, name: 'Coffee', price: 4.99 },
  { id: 6, name: 'Soda', price: 2.99 },
];

export default function CustomerPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderPlacing, setOrderPlacing] = useState(false);

  useEffect(() => {
    // Load session
    loadSession();

    // Setup socket connection
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join session room as customer
      socketInstance.emit('joinSession', {
        sessionId,
        userType: 'customer'
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('joinedSession', (data) => {
      console.log('Joined session:', data);
    });

    // Listen for order status updates
    socketInstance.on('statusUpdated', (data) => {
      console.log('Status updated:', data);
      setOrderStatus(data);
      if (data.adminNotes) {
        setAdminMessage(data.adminNotes);
      }
    });

    // Listen for admin events
    socketInstance.on('adminEvent', (data) => {
      console.log('Admin event:', data);
      if (data.type === 'adminMessage') {
        setAdminMessage(data.message);
      }
    });

    // Listen for order confirmation
    socketInstance.on('orderConfirmed', (data) => {
      console.log('Order confirmed:', data);
      setOrderStatus({ orderId: data.orderId, status: 'pending' });
      setSelectedItems({});
      setCustomerNotes('');
      setOrderPlacing(false);
      // Show success message
      alert('Order placed successfully! Order ID: ' + data.orderId.substring(0, 8));
    });
    
    // Listen for socket errors
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setOrderPlacing(false);
      alert('Error: ' + (error.message || 'Connection error'));
    });

    return () => {
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('joinedSession');
      socketInstance.off('statusUpdated');
      socketInstance.off('adminEvent');
      socketInstance.off('orderConfirmed');
    };
  }, [sessionId]);

  // Handle typing events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const typingTimeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('customerTyping', { sessionId, isTyping: false });
      }
    }, 1000);

    if (customerNotes.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit('customerTyping', { sessionId, isTyping: true });
    }

    return () => clearTimeout(typingTimeout);
  }, [customerNotes, socket, isConnected, sessionId, isTyping]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSession(sessionId);
      if (result.success) {
        setSession(result.session);
      } else {
        setError('Session not found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load session. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (!socket || !isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }

    // Emit button clicked event
    socket.emit('buttonClicked', {
      sessionId,
      buttonId: item.id,
      buttonLabel: item.name
    });

    // Toggle item selection
    setSelectedItems(prev => {
      const newSelection = { ...prev };
      if (newSelection[item.id]) {
        delete newSelection[item.id];
        socket.emit('itemSelected', {
          sessionId,
          itemId: item.id,
          itemName: item.name,
          selected: false
        });
      } else {
        newSelection[item.id] = { ...item, quantity: 1 };
        socket.emit('itemSelected', {
          sessionId,
          itemId: item.id,
          itemName: item.name,
          selected: true
        });
      }
      return newSelection;
    });
  };

  const updateQuantity = (itemId, delta) => {
    setSelectedItems(prev => {
      const newSelection = { ...prev };
      if (newSelection[itemId]) {
        const newQuantity = Math.max(1, newSelection[itemId].quantity + delta);
        newSelection[itemId] = { ...newSelection[itemId], quantity: newQuantity };
      }
      return newSelection;
    });
  };

  const handlePlaceOrder = async () => {
    const items = Object.values(selectedItems);
    if (items.length === 0) {
      alert('Please select at least one item');
      return;
    }

    if (!socket || !isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }

    try {
      setOrderPlacing(true);
      
      // Set timeout for order placement (15 seconds)
      const timeoutId = setTimeout(() => {
        setOrderPlacing(false);
        alert('Order placement is taking too long. Please check your connection and try again.');
      }, 15000);
      
      // Clear timeout when order is confirmed
      const originalOnOrderConfirmed = socket._callbacks['$orderConfirmed'];
      socket.once('orderConfirmed', () => {
        clearTimeout(timeoutId);
      });
      
      // Emit order via socket for real-time
      socket.emit('orderPlaced', {
        sessionId,
        items: items.map(item => ({
          itemName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        customerNotes
      });
      
      // Note: orderPlacing will be reset when orderConfirmed event is received
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order: ' + (error.message || 'Unknown error'));
      setOrderPlacing(false);
    }
  };

  const getTotal = () => {
    return Object.values(selectedItems).reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The session you are looking for does not exist.'}</p>
          <p className="text-sm text-gray-500">Please check the QR code or URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.name}</h1>
          {session.tableNumber && (
            <p className="text-gray-600">Table {session.tableNumber}</p>
          )}
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>
        </div>

        {/* Order Status */}
        {orderStatus && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Order Status</p>
                <p className="text-lg font-semibold">
                  Order #{orderStatus.orderId?.substring(0, 8) || 'N/A'}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(orderStatus.status)}`}>
                {orderStatus.status}
              </span>
            </div>
            {adminMessage && (
              <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <p className="text-sm text-blue-900">{adminMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedItems[item.id]
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">${item.price.toFixed(2)}</p>
                  {selectedItems[item.id] && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, -1);
                        }}
                        className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium">{selectedItems[item.id].quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, 1);
                        }}
                        className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Items Summary */}
        {Object.keys(selectedItems).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Order</h2>
            <div className="space-y-2 mb-4">
              {Object.values(selectedItems).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-lg font-bold">Total:</p>
              <p className="text-xl font-bold text-indigo-600">${getTotal().toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="3"
            placeholder="Any special requests or notes..."
          />
        </div>

        {/* Place Order Button */}
        {Object.keys(selectedItems).length > 0 && (
          <button
            onClick={handlePlaceOrder}
            disabled={!isConnected || orderPlacing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            {orderPlacing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Placing Order...
              </>
            ) : !isConnected ? (
              'Connecting...'
            ) : (
              'Place Order'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

