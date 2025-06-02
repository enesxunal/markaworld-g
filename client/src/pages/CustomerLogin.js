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
  Divider
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
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={4}>
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ height: '80px', marginBottom: '20px' }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Müşteri Girişi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email ve şifreniz ile giriş yapın
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
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
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            veya
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleRegister}
          sx={{ py: 1.5 }}
        >
          Yeni Hesap Oluştur
        </Button>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Hesabınız yok mu? Yukarıdaki "Yeni Hesap Oluştur" butonunu kullanın.
          </Typography>
        </Box>

        <Box textAlign="center" mt={2}>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/admin-login')}
            sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
          >
            Admin Paneli
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerLogin; 