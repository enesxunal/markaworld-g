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
        navigate('/customer-profile');
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
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={isMobile ? 2 : 3} 
        sx={{ 
          p: isMobile ? 3 : 4, 
          borderRadius: isMobile ? 2 : 3,
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px'
        }}
      >
        <Box textAlign="center" mb={isMobile ? 3 : 4}>
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ 
              height: isMobile ? '60px' : '80px', 
              marginBottom: isMobile ? '16px' : '20px' 
            }}
          />
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Müşteri Girişi
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
          >
            Email ve şifreniz ile giriş yapın
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              fontSize: isMobile ? '0.8rem' : '0.875rem'
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
                  <Email sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                </InputAdornment>
              ),
            }}
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
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
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
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <Divider sx={{ my: isMobile ? 2 : 3 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            veya
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleRegister}
          sx={{ 
            py: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Yeni Hesap Oluştur
        </Button>

        <Box textAlign="center" mt={isMobile ? 2 : 3}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              lineHeight: 1.4
            }}
          >
            Hesabınız yok mu? Yukarıdaki "Yeni Hesap Oluştur" butonunu kullanın.
          </Typography>
        </Box>

        <Box textAlign="center" mt={isMobile ? 1.5 : 2}>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/admin-login')}
            sx={{ 
              color: 'text.secondary', 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              minHeight: isMobile ? '36px' : '40px'
            }}
          >
            Admin Paneli
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerLogin; 