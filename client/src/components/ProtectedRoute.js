import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdmin }) => {
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  const customer = localStorage.getItem('customer');
  const isAdminRoute = isAdmin || location.pathname.startsWith('/admin');
  const isCustomerRoute = !isAdminRoute && location.pathname !== '/';
  
  // Admin rotası için admin token kontrolü
  if (isAdminRoute && !adminToken) {
    console.log('Admin token yok, login sayfasına yönlendiriliyor');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Müşteri rotası için müşteri kontrolü
  if (isCustomerRoute && !customer) {
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  // Admin token varsa ve login sayfasındaysa dashboard'a yönlendir
  if (adminToken && location.pathname === '/admin/login') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Müşteri varsa ve login sayfasındaysa satış detay sayfasına yönlendir
  if (customer && location.pathname === '/customer-login') {
    const customerData = JSON.parse(customer);
    return <Navigate to={`/sale/${customerData.sales[0]?.id || 1}`} replace />;
  }
  
  return children;
};

export default ProtectedRoute; 