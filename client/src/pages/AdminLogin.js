import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { clearCustomerSession } from '../utils/apiAuth';
import AuthShell from '../components/AuthShell';
import { BRAND } from '../styles/brand';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sessionExpired = searchParams.get('session') === 'expired';

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.login(formData);
      if (response.data.success) {
        clearCustomerSession();
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      if (err.response?.status === 401) {
        setError(serverMsg || 'Kullanıcı adı veya şifre hatalı.');
      } else if (err.response?.status === 503) {
        setError(serverMsg || 'Sunucu ayarı eksik (ADMIN_PASSWORD tanımlı değil).');
      } else {
        setError(serverMsg || 'Giriş başarısız');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Admin Paneli" subtitle="Marka World Yönetim Sistemi">
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Kullanıcı Adı"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="username"
          autoFocus
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { minHeight: isMobile ? 48 : 52 } }}
        />

        <TextField
          fullWidth
          label="Şifre"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { minHeight: isMobile ? 48 : 52 } }}
        />

        {sessionExpired && (
          <Alert severity="warning" sx={{ mb: 2 }}>Oturum süresi doldu. Lütfen tekrar giriş yapın.</Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem', mb: 2 }}
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>

        <Box textAlign="center">
          <Button variant="text" onClick={() => navigate('/customer-login')} sx={{ color: BRAND.warmGray, fontSize: '0.9rem' }}>
            Müşteri Girişi
          </Button>
        </Box>
      </form>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" sx={{ color: BRAND.muted, fontSize: '0.8rem' }}>
          © 2025 Marka World
        </Typography>
      </Box>
    </AuthShell>
  );
};

export default AdminLogin;
