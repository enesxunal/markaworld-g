import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute, {
  getValidCustomerSession,
  clearCustomerSession
} from './ProtectedRoute';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/customer-login"
          element={
            <ProtectedRoute>
              <div>Login Form</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute>
              <div>Profile Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <ProtectedRoute isAdmin>
              <div>Admin Login Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute isAdmin>
              <div>Admin Dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

test('BUG-001: valid customer on /customer-login goes to profile', () => {
  localStorage.setItem('customerToken', 'tok-customer');
  localStorage.setItem('customer', JSON.stringify({ id: 1, name: 'Test' }));
  renderAt('/customer-login');
  expect(screen.getByText('Profile Page')).toBeInTheDocument();
});

test('BUG-001: broken JSON clears session and shows login', () => {
  localStorage.setItem('customerToken', 'tok');
  localStorage.setItem('customer', '{broken');
  renderAt('/customer-login');
  expect(screen.getByText('Login Form')).toBeInTheDocument();
  expect(localStorage.getItem('customer')).toBeNull();
  expect(localStorage.getItem('customerToken')).toBeNull();
});

test('BUG-001: customer without token is invalid', () => {
  localStorage.setItem('customer', JSON.stringify({ id: 1 }));
  expect(getValidCustomerSession()).toBeNull();
  expect(localStorage.getItem('customer')).toBeNull();
});

test('BUG-001: token without customer is invalid', () => {
  localStorage.setItem('customerToken', 'only-token');
  expect(getValidCustomerSession()).toBeNull();
  expect(localStorage.getItem('customerToken')).toBeNull();
});

test('admin token does not unlock customer profile', () => {
  localStorage.setItem('adminToken', 'admin-tok');
  renderAt('/customer/profile');
  expect(screen.getByText('Login Form')).toBeInTheDocument();
});

test('customer token does not unlock admin dashboard', () => {
  localStorage.setItem('customerToken', 'cust-tok');
  localStorage.setItem('customer', JSON.stringify({ id: 2 }));
  renderAt('/admin/dashboard');
  expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
});

test('clearCustomerSession removes both keys', () => {
  localStorage.setItem('customerToken', 'a');
  localStorage.setItem('customer', '{}');
  clearCustomerSession();
  expect(localStorage.getItem('customerToken')).toBeNull();
  expect(localStorage.getItem('customer')).toBeNull();
});
