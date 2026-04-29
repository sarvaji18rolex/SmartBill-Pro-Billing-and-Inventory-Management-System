import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Products ───────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
  updateStock: (id, data) => api.post(`/products/${id}/stock`, data),
}

// ── Customers ──────────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getInvoices: (id, params) => api.get(`/customers/${id}/invoices`, { params }),
}

// ── Invoices ───────────────────────────────────────────────────────────────────
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getSalesTrend: (days) => api.get('/dashboard/sales-trend', { params: { days } }),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getMonthlyComparison: (months) => api.get('/dashboard/monthly-comparison', { params: { months } }),
  getPaymentMethods: (days) => api.get('/dashboard/payment-methods', { params: { days } }),
  getLowStock: () => api.get('/dashboard/low-stock'),
  getRecentInvoices: (limit) => api.get('/dashboard/recent-invoices', { params: { limit } }),
  getSmartInsights: () => api.get('/dashboard/smart-insights'),
}

export default api
