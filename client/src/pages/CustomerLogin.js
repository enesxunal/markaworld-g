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
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await customerAPI.login(formData);
      
      if (response.data.success) {
        // Müşteri bilgilerini localStorage'a kaydet
        localStorage.setItem('customer', JSON.stringify(response.data.customer));
        
        // Müşteri profil sayfasına yönlendir
        navigate('/customer/profile');
      } else {
        setError('Giriş bilgileri hatalı. Lütfen TC kimlik numaranızı ve telefon numaranızı kontrol edin.');
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/customer-register');
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
        justifyContent: 'center',
        background: isMobile ? 'transparent' : 'rgba(0,0,0,0.02)'
      }}
    >
      <Paper 
        elevation={isMobile ? 2 : 3} 
        sx={{ 
          p: isMobile ? 3 : 4, 
          borderRadius: isMobile ? 2 : 3,
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px',
          boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 16px rgba(0,0,0,0.1)'
        }}
      >
        <Box textAlign="center" mb={isMobile ? 3 : 4}>
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ 
              height: isMobile ? '60px' : '80px', 
              marginBottom: isMobile ? '16px' : '20px',
              width: 'auto'
            }}
          />
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              fontSize: isMobile ? '1.5rem' : '2rem'
            }}
          >
            Müşteri Girişi
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              maxWidth: '80%',
              margin: '0 auto'
            }}
          >
            Email ve şifreniz ile giriş yapın
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
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
                  <Email sx={{ 
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    color: 'action.active'
                  }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: isMobile ? 1.5 : 2,
              '& .MuiOutlinedInput-root': {
                minHeight: isMobile ? '48px' : '56px',
                backgroundColor: 'background.paper'
              }
            }}
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
                  <Lock sx={{ 
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    color: 'action.active'
                  }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ color: 'action.active' }}
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
                backgroundColor: 'background.paper'
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: isMobile ? 2 : 3, 
              mb: 2, 
              py: isMobile ? 1.5 : 2,
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 'bold',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                opacity: 0.9
              }
            }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>

          <Divider sx={{ my: isMobile ? 2 : 3 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}
            >
              veya
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleRegister}
            size="large"
            sx={{ 
              py: isMobile ? 1.5 : 2,
              fontSize: isMobile ? '0.9rem' : '1rem',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Yeni Hesap Oluştur
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default CustomerLogin; 