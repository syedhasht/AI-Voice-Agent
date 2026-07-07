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
