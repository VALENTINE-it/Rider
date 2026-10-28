/**
 * Rider Boda — API Client Service
 * Compliant with docs/API.md (v1.0)
 * Uses credentials: 'include' for HttpOnly session cookies, CSRF protection, and standardized envelopes.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

function generateRequestId() {
  return 'req_' + Math.random().toString(36).substring(2, 10);
}

let csrfToken = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf`, {
      credentials: 'include',
      headers: { 'X-Request-ID': generateRequestId() },
    });
    if (res.ok) {
      const json = await res.json();
      csrfToken = json.data?.csrf_token;
    }
  } catch (e) {
    console.warn('Failed to fetch CSRF token:', e);
  }
  return csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const reqId = generateRequestId();

  // If making state-changing request and no CSRF token yet, fetch it
  if (!csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
    await fetchCsrfToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': reqId,
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(body?.error?.message || `Request failed (${res.status})`);
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = res.status;
    err.details = body?.error?.details || [];
    throw err;
  }

  return body?.data;
}

export const api = {
  // Auth
  auth: {
    csrf: () => fetchCsrfToken(),
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (phone, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
    adminLogin: (phone, password) => apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    me: () => apiRequest('/auth/me', { method: 'GET' }),
  },

  // Quotes
  quotes: {
    calculate: (data) => apiRequest('/quotes', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Trips
  trips: {
    create: (data) => apiRequest('/trips', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiRequest('/trips', { method: 'GET' }),
    getActive: () => apiRequest('/trips/active', { method: 'GET' }),
    get: (id) => apiRequest(`/trips/${id}`, { method: 'GET' }),
    updateStatus: (id, status, reason = '') =>
      apiRequest(`/trips/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason }) }),
    confirmPayment: (id) => apiRequest(`/trips/${id}/payment`, { method: 'POST' }),
    acceptOffer: (id) => apiRequest(`/trips/${id}/offers/accept`, { method: 'POST' }),
    rejectOffer: (id) => apiRequest(`/trips/${id}/offers/reject`, { method: 'POST' }),
  },

  // Rider
  rider: {
    getPresence: () => apiRequest('/auth/me').then((d) => d?.presence),
    setPresence: (isOnline) => apiRequest('/rider/presence', { method: 'POST', body: JSON.stringify({ is_online: isOnline }) }),
    updateLocation: (coords) => apiRequest('/rider/location', { method: 'POST', body: JSON.stringify(coords) }),
    getActiveOffer: () => apiRequest('/rider/offers/active', { method: 'GET' }),
    getEarnings: () => apiRequest('/rider/earnings', { method: 'GET' }),
    getSubscription: () => apiRequest('/rider/subscription', { method: 'GET' }),
    getMotorbike: () => apiRequest('/rider/motorbikes', { method: 'GET' }),
    updateMotorbike: (data) => apiRequest('/rider/motorbikes', { method: 'POST', body: JSON.stringify(data) }),
    getDocuments: () => apiRequest('/rider/documents', { method: 'GET' }),
    uploadDocument: (data) => apiRequest('/rider/documents', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Passenger
  passenger: {
    getProfile: () => apiRequest('/passenger/profile', { method: 'GET' }),
    updateProfile: (data) => apiRequest('/passenger/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Safety
  safety: {
    report: (data) => apiRequest('/safety/reports', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Admin
  admin: {
    getOverview: () => apiRequest('/admin/overview', { method: 'GET' }),
    getPassengers: () => apiRequest('/admin/passengers', { method: 'GET' }),
    setUserStatus: (id, status, reason = '') =>
      apiRequest(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
    getRiders: (status = '') => apiRequest(`/admin/riders${status ? `?status=${status}` : ''}`, { method: 'GET' }),
    reviewRider: (id, decision, notes = '') =>
      apiRequest(`/admin/riders/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),
    getTrips: (status = '') => apiRequest(`/admin/trips${status ? `?status=${status}` : ''}`, { method: 'GET' }),
    getPricing: () => apiRequest('/admin/pricing', { method: 'GET' }),
    updatePricing: (data) => apiRequest('/admin/pricing', { method: 'POST', body: JSON.stringify(data) }),
    getSubscriptions: () => apiRequest('/admin/subscriptions', { method: 'GET' }),
    createPlan: (data) => apiRequest('/admin/subscriptions/plans', { method: 'POST', body: JSON.stringify(data) }),
    grantSubscription: (data) => apiRequest('/admin/subscriptions/grant', { method: 'POST', body: JSON.stringify(data) }),
    getSafety: () => apiRequest('/admin/safety', { method: 'GET' }),
    updateSafetyStatus: (id, status, notes = '') =>
      apiRequest(`/admin/safety/${id}`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
    getAdministrators: () => apiRequest('/admin/administrators', { method: 'GET' }),
    createAdministrator: (data) => apiRequest('/admin/administrators', { method: 'POST', body: JSON.stringify(data) }),
    getAuditLogs: () => apiRequest('/admin/audit-logs', { method: 'GET' }),
  },
};
