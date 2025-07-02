import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Login
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.login(formData);
      
      if (response.data.success) {
        // Admin token'ını localStorage'a kaydet
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        
        // Admin dashboard'a yönlendir
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        py: isMobile ? 2 : 8,
        px: isMobile ? 1 : 3,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={isMobile ? 4 : 6} 
        sx={{ 
          p: isMobile ? 3 : 4, 
          borderRadius: isMobile ? 2 : 3,
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px'
        }}
      >
        <Box textAlign="center" mb={isMobile ? 3 : 4}>
          <AdminPanelSettings 
            sx={{ 
              fontSize: isMobile ? 48 : 60, 
              color: 'primary.main', 
              mb: isMobile ? 1.5 : 2 
            }} 
          />
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            gutterBottom 
            sx={{ fontWeight: 'bold' }}
          >
            Admin Paneli
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "h6"} 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.8rem' : '1rem' }}
          >
            Marka World Yönetim Sistemi
          </Typography>
        </Box>

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
            sx={{ 
              mb: isMobile ? 1.5 : 2,
              '& .MuiOutlinedInput-root': {
                minHeight: isMobile ? '48px' : '56px',
              }
            }}
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
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    size={isMobile ? 'small' : 'medium'}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: isMobile ? 2 : 3,
              '& .MuiOutlinedInput-root': {
                minHeight: isMobile ? '48px' : '56px',
              }
            }}
          />

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={<Login />}
            sx={{ 
              py: isMobile ? 1.5 : 2,
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 'bold',
              mb: 2
            }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
          </Button>

          <Box textAlign="center">
            <Button
              variant="text"
              onClick={() => navigate('/customer-login')}
              sx={{ 
                color: 'text.secondary',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                minHeight: isMobile ? '36px' : '40px'
              }}
            >
              Müşteri Girişi
            </Button>
          </Box>
        </form>

        <Box mt={isMobile ? 3 : 4} textAlign="center">
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
          >
            © 2024 Marka World - Tüm hakları saklıdır
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin; 