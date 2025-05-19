// This file provides integration with the backend API
import { apiRequest } from './queryClient';

// Get band data
export const getBandData = async () => {
  const response = await fetch('/api/band-data');
  if (!response.ok) {
    throw new Error('Failed to fetch band data');
  }
  return await response.json();
};

// Get band data history
export const getBandDataHistory = async (limit = 100) => {
  const response = await fetch(`/api/band-data/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch band data history');
  }
  return await response.json();
};

// Get positions
export const getPositions = async (accountId?: number) => {
  const url = accountId ? `/api/positions?accountId=${accountId}` : '/api/positions';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch positions');
  }
  return await response.json();
};

// Get orders
export const getOrders = async (accountId?: number) => {
  const url = accountId ? `/api/orders?accountId=${accountId}` : '/api/orders';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return await response.json();
};

// Place order
export const placeOrder = async (order: any) => {
  const response = await apiRequest('POST', '/api/orders', order);
  return await response.json();
};

// Update order
export const updateOrder = async (id: number, orderUpdate: any) => {
  const response = await apiRequest('PUT', `/api/orders/${id}`, orderUpdate);
  return await response.json();
};

// Cancel order
export const cancelOrder = async (id: number) => {
  await apiRequest('DELETE', `/api/orders/${id}`);
};

// Get logs
export const getLogs = async () => {
  const response = await fetch('/api/logs');
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return await response.json();
};

// Get quote data
export const getQuoteData = async (symbol: string) => {
  const response = await fetch(`/api/quote/${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quote data for ${symbol}`);
  }
  return await response.json();
};

// Get quote history
export const getQuoteHistory = async (symbol: string, limit = 100) => {
  const response = await fetch(`/api/quote/${symbol}/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quote history for ${symbol}`);
  }
  return await response.json();
};

// Get service status
export const getServiceStatus = async () => {
  const response = await fetch('/api/service-status');
  if (!response.ok) {
    throw new Error('Failed to fetch service status');
  }
  return await response.json();
};

// Get program state
export const getProgramState = async () => {
  const response = await fetch('/api/program-state');
  if (!response.ok) {
    throw new Error('Failed to fetch program state');
  }
  return await response.json();
};

// Toggle program state
export const toggleProgramState = async () => {
  const response = await apiRequest('POST', '/api/program-state/toggle', {});
  return await response.json();
};

// Get global settings
export const getGlobalSettings = async () => {
  try {
    const response = await fetch('/api/settings/global');
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch global settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return null;
  }
};

// Save global settings
export const saveGlobalSettings = async (settings: any) => {
  const response = await apiRequest('POST', '/api/settings/global', settings);
  return await response.json();
};

// Get daily parameters
export const getDailyParameters = async () => {
  try {
    const response = await fetch('/api/settings/daily');
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch daily parameters');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching daily parameters:', error);
    return null;
  }
};

// Save daily parameters
export const saveDailyParameters = async (parameters: any) => {
  const response = await apiRequest('POST', '/api/settings/daily', parameters);
  return await response.json();
};

// Get accounts
export const getAccounts = async () => {
  const response = await fetch('/api/accounts');
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return await response.json();
};

// Create account
export const createAccount = async (account: any) => {
  const response = await apiRequest('POST', '/api/accounts', account);
  return await response.json();
};

// Update account
export const updateAccount = async (id: number, accountUpdate: any) => {
  const response = await apiRequest('PUT', `/api/accounts/${id}`, accountUpdate);
  return await response.json();
};

// Delete account
export const deleteAccount = async (id: number) => {
  await apiRequest('DELETE', `/api/accounts/${id}`);
};
