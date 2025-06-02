import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://markaworld.vercel.app/api' 
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hata yakalama
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Hatası:', error);
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
  increaseLimit: (id) => api.post(`/customers/${id}/increase-limit`),
  
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
};

export default api; 