import axios from 'axios';
import {
  isAdminApi,
  isCustomerMeApi,
  clearAdminSession,
  clearCustomerSession
} from '../utils/apiAuth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://markaworld.com.tr/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — admin ve müşteri token'ları karışmasın
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    delete config.headers.Authorization;

    if (isCustomerMeApi(url)) {
      const customerToken = localStorage.getItem('customerToken');
      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
      }
      return config;
    }

    if (isAdminApi(url)) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      return config;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const msg = error.response?.data?.error || error.message;
    console.error('API Error:', msg);

    if (status === 401 || status === 403) {
      if (isAdminApi(url)) {
        clearAdminSession();
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.assign('/admin/login?session=expired');
        }
      } else if (isCustomerMeApi(url)) {
        clearCustomerSession();
        if (!window.location.pathname.startsWith('/customer-login')) {
          window.location.assign('/customer-login?session=expired');
        }
      }
    }

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

  // Doğrulama e-postasını yeniden gönder
  resendVerification: (email) => api.post('/customers/resend-verification', { email }),
  
  // Sözleşme onayı ve kayıt tamamlama
  completeRegistration: (token, agreements) => api.post(`/customers/complete-registration/${token}`, agreements),
  
  // Müşteri satışları (admin)
  getSales: (customerId) => api.get(`/customers/${customerId}/sales`),
  
  // Müşteri taksitleri (admin)
  getInstallments: (customerId) => api.get(`/customers/${customerId}/installments`),

  // Müşteri paneli (giriş yapmış müşteri)
  getMe: () => api.get('/customers/me'),
  getMySales: () => api.get('/customers/me/sales'),
  getMyInstallments: () => api.get('/customers/me/installments'),
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