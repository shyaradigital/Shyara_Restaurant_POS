'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../../lib/socket';
import { getAllOrders, updateOrderStatus } from '../../lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [customerEvents, setCustomerEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load initial orders
    loadOrders();

    // Setup socket connection
    const socketInstance = getSocket();
    setSocket(socketInstance);

    const handleConnect = () => {
      console.log('Admin: Connected to server');
      setIsConnected(true);
      
      // Join as admin to receive all orders
      // Admin doesn't need a specific sessionId - receives all orders
      socketInstance.emit('joinAdmin', { userType: 'admin' });
    };

    const handleDisconnect = () => {
      console.log('Admin: Disconnected from server');
      setIsConnected(false);
    };

    const handleNewOrder = (data) => {
      console.log('Admin: New order received:', data);
      if (data && data.order) {
        setOrders(prev => {
          // Check if order already exists
          const exists = prev.some(o => o.orderId === data.order.orderId);
          if (exists) return prev;
          return [data.order, ...prev];
        });
        setCustomerEvents(prev => [{
          type: 'newOrder',
          message: `New order #${data.order.orderId.substring(0, 8)}`,
          timestamp: new Date()
        }, ...prev]);
      }
    };

    const handleCustomerEvent = (data) => {
      console.log('Admin: Customer event:', data);
      setCustomerEvents(prev => [{
        ...data,
        timestamp: new Date(data.timestamp || Date.now())
      }, ...prev]);
    };

    const handleOrderStatusUpdated = (data) => {
      console.log('Admin: Order status updated:', data);
      setOrders(prev => prev.map(order => 
        order.orderId === data.orderId 
          ? { ...order, status: data.status }
          : order
      ));
    };

    const handleInitialOrders = (data) => {
      console.log('Admin: Initial orders received:', data);
      if (data && data.orders) {
        setOrders(data.orders);
      }
    };

    const handleError = (error) => {
      console.error('Admin: Socket error:', error);
      setError(error.message || 'Socket connection error');
    };

    // Register event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('newOrder', handleNewOrder);
    socketInstance.on('customerEvent', handleCustomerEvent);
    socketInstance.on('orderStatusUpdated', handleOrderStatusUpdated);
    socketInstance.on('initialOrders', handleInitialOrders);
    socketInstance.on('error', handleError);

    // If already connected, join immediately
    if (socketInstance.connected) {
      handleConnect();
    }

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('newOrder', handleNewOrder);
      socketInstance.off('customerEvent', handleCustomerEvent);
      socketInstance.off('orderStatusUpdated', handleOrderStatusUpdated);
      socketInstance.off('initialOrders', handleInitialOrders);
      socketInstance.off('error', handleError);
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllOrders();
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to connect to server. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      if (!socket || !isConnected) {
        alert('Not connected to server. Please wait for connection...');
        return;
      }

      // Use socket for real-time update (faster and more reliable)
      socket.emit('updateOrderStatus', {
        orderId,
        status: newStatus,
        adminNotes: ''
      });
      
      console.log('Status update sent via socket:', { orderId, status: newStatus });
      
      // Also update via REST API for persistence (non-blocking, don't wait)
      updateOrderStatus(orderId, newStatus).catch(apiError => {
        console.warn('API update failed (non-critical, socket update should work):', apiError);
      });
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status: ' + (error.message || 'Unknown error'));
    }
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Connection: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => router.push('/admin/sessions')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Manage Sessions
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Orders ({orders.length})</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-500 mt-2">Loading orders...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button
                    onClick={loadOrders}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet. Orders will appear here in real-time!</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.orderId} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Order #{order.orderId.substring(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Session: {order.sessionId.substring(0, 8)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-600">
                              {item.quantity}x {item.itemName} 
                              {item.price > 0 && <span className="text-gray-500"> - ${item.price.toFixed(2)}</span>}
                            </li>
                          ))}
                        </ul>
                        {order.totalAmount > 0 && (
                          <p className="text-sm font-semibold text-gray-900 mt-2">
                            Total: ${order.totalAmount.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {order.customerNotes && (
                        <p className="text-sm text-gray-600 mb-3 italic">
                          Notes: {order.customerNotes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {['pending', 'accepted', 'preparing', 'ready', 'completed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(order.orderId, status)}
                            disabled={order.status === status}
                            className={`px-3 py-1 text-xs rounded transition ${
                              order.status === status
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Events Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Live Events</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {customerEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events yet</p>
                ) : (
                  customerEvents.slice(0, 20).map((event, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-500 pl-3 py-2 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-900">
                        {event.type === 'buttonClicked' && `Button: ${event.buttonLabel}`}
                        {event.type === 'itemSelected' && `Item: ${event.itemName} (${event.selected ? 'Selected' : 'Deselected'})`}
                        {event.type === 'customerTyping' && `Customer ${event.isTyping ? 'typing...' : 'stopped typing'}`}
                        {event.type === 'newOrder' && event.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

