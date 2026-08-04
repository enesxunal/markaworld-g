import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function clearCustomerSession() {
  localStorage.removeItem('customer');
  localStorage.removeItem('customerToken');
}

export function clearAdminSession() {
  localStorage.removeItem('adminToken');
}

/**
 * Geçerli müşteri oturumu: hem customerToken hem parse edilebilir customer objesi gerekir.
 * Bozuk JSON veya eksik parça varsa localStorage temizlenir.
 */
export function getValidCustomerSession() {
  const token = localStorage.getItem('customerToken');
  const raw = localStorage.getItem('customer');

  if (!token || !raw) {
    if (token || raw) {
      clearCustomerSession();
    }
    return null;
  }

  try {
    const customer = JSON.parse(raw);
    if (!customer || typeof customer !== 'object') {
      clearCustomerSession();
      return null;
    }
    return customer;
  } catch {
    clearCustomerSession();
    return null;
  }
}

export function hasAdminSession() {
  const token = localStorage.getItem('adminToken');
  return Boolean(token && String(token).trim());
}

const ProtectedRoute = ({ children, isAdmin }) => {
  const location = useLocation();
  const isAdminRoute = isAdmin || location.pathname.startsWith('/admin');
  const adminOk = hasAdminSession();
  const customer = getValidCustomerSession();

  // Admin rotası: yalnızca admin token
  if (isAdminRoute) {
    if (location.pathname === '/admin/login') {
      if (adminOk) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return children;
    }
    if (!adminOk) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return children;
  }

  // Müşteri login sayfası: geçerli oturum varsa profile
  if (location.pathname === '/customer-login') {
    if (customer) {
      return <Navigate to="/customer/profile" replace />;
    }
    return children;
  }

  // Korumalı müşteri rotaları
  if (!customer) {
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
