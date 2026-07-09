import api from './client';
import { mapOrderFromApi, mapOrderToApi } from '../utils/helpers';

export async function fetchOrders() {
  const { data } = await api.get('/orders');
  return data.items.map(mapOrderFromApi);
}

export async function fetchOrderById(id) {
  const { data } = await api.get(`/orders/${id}`);
  return mapOrderFromApi(data);
}

export async function createOrder(formData) {
  const payload = mapOrderToApi(formData);
  const { data } = await api.post('/orders', payload);
  return mapOrderFromApi(data);
}

export async function updateOrder(id, updates) {
  const { data } = await api.put(`/orders/${id}`, updates);
  return mapOrderFromApi(data);
}

export async function deleteOrder(id) {
  await api.delete(`/orders/${id}`);
}

export async function startElevenLabsSession(orderId) {
  const { data } = await api.post(`/demo/elevenlabs-session/${orderId}`);
  return data;
}

export async function fetchDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function fetchDashboardCharts() {
  const { data } = await api.get('/dashboard/charts');
  return data;
}

export async function fetchRecentOrders() {
  const { data } = await api.get('/dashboard/recent-orders');
  return data;
}

export async function fetchRecentCalls() {
  const { data } = await api.get('/dashboard/recent-calls');
  return data;
}

export async function fetchCustomers(params = {}) {
  const { data } = await api.get('/customers', { params });
  return data;
}
export async function fetchCustomerById(customerId) {
  const { data } = await api.get(`/customers/${customerId}`);
  return data;
}

export async function fetchCalls(params = {}) {
  const { data } = await api.get('/calls', { params });
  return data;
}

export async function fetchCallById(callId) {
  const { data } = await api.get(`/calls/${callId}`);
  return data;
}

// Deprecated stubs — kept for backward compatibility
export async function demoVoice() {
  throw new Error('demoVoice is deprecated. Use startElevenLabsSession instead.');
}

export async function startSession() {
  throw new Error('startSession is deprecated. Use startElevenLabsSession instead.');
}

export async function voiceTurn() {
  throw new Error('voiceTurn is deprecated. ElevenLabs handles conversation logic.');
}

export async function endSession() {
  throw new Error('endSession is deprecated. ElevenLabs handles session lifecycle.');
}

/**
 * Query the Enterprise AI Assistant with a natural language question.
 * Uses a 90s timeout since Gemini + SQL execution may take up to ~10s.
 */
export async function queryAssistant(question) {
  const { data } = await api.post(
    '/assistant/query',
    { question },
    { timeout: 90000 }
  );
  return data;
}

