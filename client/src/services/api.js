import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Önce admin token'ı kontrol et
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }

    // Admin token yoksa normal token'ı kontrol et
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - sadece hataları logla
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

// Müşteri API'leri
export const customerAPI = {
  // Tüm müşterileri getir
  getAll: (params = {}) => api.get('/customers', { params }),
  
  // Müşteri detayı getir
  getById: (id) => api.get(`/customers/${id}`),
  
  // Yeni müşteri ekle (admin)
  create: (customerData) => api.post('/customers', customerData),
  
  // Müşteri güncelle
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  
  // Müşteri sil
  delete: (id) => api.delete(`/customers/${id}`),
  
  // Kredi limitini artır
  increaseLimit: (id, data) => api.post(`/customers/${id}/increase-limit`, data),
  
  // Müşteri kayıt (self-registration)
  register: (customerData) => api.post('/customers/register', customerData),
  
  // Müşteri giriş
  login: (credentials) => api.post('/customers/login', credentials),
  
  // Email onay
  verifyEmail: (token) => api.get(`/customers/verify-email/${token}`),
  
  // Sözleşme onayı ve kayıt tamamlama
  completeRegistration: (token, agreements) => api.post(`/customers/complete-registration/${token}`, agreements),
  
  // Müşteri satışları
  getSales: (customerId) => api.get(`/customers/${customerId}/sales`),
  
  // Müşteri taksitleri
  getInstallments: (customerId) => api.get(`/customers/${customerId}/installments`),
};

// Satış API'leri
export const salesAPI = {
  // Tüm satışları getir
  getAll: (params = {}) => api.get('/sales', { params }),
  
  // Satış detayı getir
  getById: (id) => api.get(`/sales/${id}`),
  
  // Yeni satış oluştur
  create: (saleData) => api.post('/sales', saleData),
  
  // Satışı onayla
  approve: (token) => api.post(`/sales/approve/${token}`),
  
  // Taksit ödemesi kaydet
  payInstallment: (saleId, installmentId, paymentData) => 
    api.post(`/sales/${saleId}/installments/${installmentId}/pay`, paymentData),
  
  // Satışı iptal et
  cancel: (id) => api.delete(`/sales/${id}`),
  
  // Yaklaşan taksitleri getir
  getUpcomingInstallments: (days = 5) => api.get(`/sales/installments/upcoming?days=${days}`),

  // Gelecek ödemeleri getir
  getFuturePayments: (params = {}) => api.get('/sales/future-payments', { params }),

  delete: (id) => api.delete(`/sales/${id}`),
};

// Sistem API'leri
export const systemAPI = {
  // Sistem durumu
  health: () => api.get('/health'),
  
  // Manuel günlük kontroller
  runDailyChecks: () => api.post('/admin/run-daily-checks'),
};

// Admin API'leri
export const adminAPI = {
  // Admin giriş
  login: (credentials) => api.post('/admin/login', credentials),
  
  // Admin çıkış
  logout: () => api.post('/admin/logout'),
  
  // Admin profil
  getProfile: () => api.get('/admin/profile'),

  // Mail listesi
  getSubscribers: () => api.get('/email/subscribers'),

  // Toplu mail gönder
  sendBulkEmail: (subject, content) => api.post('/admin/send-bulk-email', { subject, content }),

  // Yedekleri listele
  get: (endpoint) => api.get(`/admin${endpoint}`),

  // Yeni yedek oluştur
  post: (endpoint) => api.post(`/admin${endpoint}`),

  // Yedek sil
  delete: (endpoint) => api.delete(`/admin${endpoint}`)
};

// Email API'leri
export const emailAPI = {
  // Mail listesine kayıt
  subscribe: (email) => api.post('/email/subscribe', { email }),
  
  // Mail listesini getir
  getList: () => api.get('/email/list')
};

export default api;