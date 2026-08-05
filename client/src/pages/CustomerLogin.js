import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerAPI } from '../services/api';
import { clearAdminSession } from '../utils/apiAuth';
import AuthShell from '../components/AuthShell';
import SeoHead from '../components/SeoHead';
import { BRAND } from '../styles/brand';
import { SEO_PAGES } from '../seo/siteConfig';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const successMessage = location.state?.message;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await customerAPI.login(formData);
      if (response.data.success) {
        clearAdminSession();
        localStorage.setItem('customer', JSON.stringify(response.data.customer));
        if (response.data.token) {
          localStorage.setItem('customerToken', response.data.token);
        }
        navigate('/customer/profile');
      } else {
        setError('Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol edin.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title={SEO_PAGES.customerLogin.title}
        description={SEO_PAGES.customerLogin.description}
        robots={SEO_PAGES.customerLogin.robots}
        noCanonical
      />
      <AuthShell title="Müşteri Girişi" subtitle="E-posta ve şifreniz ile giriş yapın">
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="E-posta"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: BRAND.warmGray }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { minHeight: isMobile ? 48 : 52 } }}
        />

        <TextField
          fullWidth
          label="Şifre"
          name="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
          autoComplete="current-password"
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: BRAND.warmGray }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { minHeight: isMobile ? 48 : 52 } }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem' }}
        >
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">veya</Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={() => navigate('/customer-register')}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          Yeni Hesap Oluştur
        </Button>

        <Box textAlign="center" mt={3}>
          <Button variant="text" onClick={() => navigate('/')} sx={{ color: BRAND.warmGray, fontSize: '0.9rem' }}>
            Ana Sayfaya Dön
          </Button>
        </Box>
      </form>
    </AuthShell>
    </>
  );
};

export default CustomerLogin;
