import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createSession = async (name, tableNumber) => {
  const response = await api.post('/api/sessions/create', { name, tableNumber });
  return response.data;
};

export const getAllSessions = async () => {
  const response = await api.get('/api/sessions/all');
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
};

export const getOrdersBySession = async (sessionId) => {
  const response = await api.get(`/api/orders/session/${sessionId}`);
  return response.data;
};

export const getAllOrders = async () => {
  const response = await api.get('/api/orders/all');
  return response.data;
};

export const updateOrderStatus = async (orderId, status, adminNotes) => {
  const response = await api.put(`/api/orders/${orderId}/status`, { status, adminNotes });
  return response.data;
};

export const createOrder = async (sessionId, items, customerNotes) => {
  const response = await api.post('/api/orders/create', { sessionId, items, customerNotes });
  return response.data;
};

