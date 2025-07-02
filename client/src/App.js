import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/tr';
import theme from './theme';

// Admin sayfaları
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Sales from './pages/Sales';
import NewSale from './pages/NewSale';
import SaleDetail from './pages/SaleDetail';
import AdminLogin from './pages/AdminLogin';
import Backups from './pages/Backups';
import BulkEmail from './pages/BulkEmail';

// Müşteri sayfaları
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerProfile from './pages/CustomerProfile';
import EmailVerification from './pages/EmailVerification';
import FuturePayments from './pages/FuturePayments';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import KVKK from './pages/KVKK';
import Unsubscribe from './pages/Unsubscribe';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/customer-register" element={<CustomerRegister />} />
            <Route path="/api/customers/verify-email/:token" element={<EmailVerification />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/contracts/:token" element={<EmailVerification />} />
            <Route path="/register" element={<CustomerRegister />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/kvkk" element={<KVKK />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute isAdmin>
                  <Layout isAdmin />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/new" element={<NewSale />} />
              <Route path="sales/:id" element={<SaleDetail />} />
              <Route path="future-payments" element={<FuturePayments />} />
              <Route path="backups" element={<Backups />} />
              <Route path="bulk-email" element={<BulkEmail />} />
              <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute>
                  <Layout isAdmin={false} />
                </ProtectedRoute>
              }
            >
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="" element={<Navigate to="/customer/profile" replace />} />
              <Route path="*" element={<Navigate to="/customer/profile" replace />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
