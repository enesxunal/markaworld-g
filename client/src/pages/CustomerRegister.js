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
  Grid,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Home,
  CreditCard,
  CalendarToday,
  CheckCircle,
  Lock
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import api, { customerAPI } from '../services/api';

const steps = ['Kişisel Bilgiler', 'İletişim Bilgileri', 'Kayıt Tamamlandı'];

const CustomerRegister = () => {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: '',
    tc_no: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    birth_date: null,
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      birth_date: date
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Ad Soyad gerekli';
      }
      if (!formData.tc_no || formData.tc_no.length !== 11) {
        newErrors.tc_no = 'TC Kimlik No 11 haneli olmalı';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Telefon numarası gerekli';
      }
    }

    if (step === 1) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email adresi gerekli';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Geçerli bir email adresi girin';
      }
      
      if (!formData.password.trim()) {
        newErrors.password = 'Şifre gerekli';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalı';
      }
      
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Şifre tekrarı gerekli';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        birth_date: formData.birth_date ? formData.birth_date.format('YYYY-MM-DD') : null
      };

      const response = await customerAPI.register(submitData);
      
      if (response.data.success) {
        setRegistrationComplete(true);
        setActiveStep(2);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.path || 'general'] = err.msg;
        });
        setErrors(apiErrors);
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Kayıt sırasında bir hata oluştu' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="TC Kimlik Numarası"
                name="tc_no"
                value={formData.tc_no}
                onChange={handleChange}
                error={!!errors.tc_no}
                helperText={errors.tc_no}
                inputProps={{ maxLength: 11 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefon Numarası"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
                <DatePicker
                  label="Doğum Tarihi (İsteğe Bağlı)"
                  value={formData.birth_date}
                  onChange={handleDateChange}
                  maxDate={dayjs().subtract(18, 'year')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                          </InputAdornment>
                        ),
                      },
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          minHeight: isMobile ? '48px' : '56px',
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Adresi"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Şifre"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Şifre Tekrarı"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres (İsteğe Bağlı)"
                name="address"
                multiline
                rows={isMobile ? 2 : 3}
                value={formData.address}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <Home sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box textAlign="center" py={isMobile ? 2 : 4}>
            <CheckCircle 
              sx={{ 
                fontSize: isMobile ? 64 : 80, 
                color: 'success.main', 
                mb: isMobile ? 2 : 3 
              }} 
            />
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              gutterBottom 
              color="success.main"
              sx={{ fontWeight: 'bold' }}
            >
              Kayıt Başarılı!
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              paragraph
              sx={{ 
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: 1.6,
                maxWidth: '400px',
                mx: 'auto'
              }}
            >
              Email adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirin.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/customer-login')}
              sx={{ 
                mt: isMobile ? 2 : 3,
                px: isMobile ? 3 : 4,
                py: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}
            >
              Giriş Sayfasına Dön
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: isMobile ? 2 : 4,
        px: isMobile ? 1 : 3,
        minHeight: '100vh'
      }}
    >
      <Paper 
        elevation={isMobile ? 2 : 3} 
        sx={{ 
          p: isMobile ? 2 : 4, 
          borderRadius: isMobile ? 2 : 3 
        }}
      >
        <Box textAlign="center" mb={isMobile ? 3 : 4}>
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ 
              height: isMobile ? '50px' : '60px', 
              marginBottom: isMobile ? '16px' : '20px' 
            }}
          />
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Yeni Hesap Oluştur
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
          >
            Marka World'da taksitli alışveriş için hesap oluşturun
          </Typography>
        </Box>

        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: isMobile ? 3 : 4,
            '& .MuiStepLabel-label': {
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{isMobile ? '' : label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.general && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              fontSize: isMobile ? '0.8rem' : '0.875rem'
            }}
          >
            {errors.general}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        {activeStep < 2 && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0,
              pt: isMobile ? 3 : 4 
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ 
                mr: isMobile ? 0 : 1,
                order: isMobile ? 2 : 1,
                minHeight: isMobile ? '48px' : '56px'
              }}
            >
              Geri
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep === steps.length - 2 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ 
                  order: isMobile ? 1 : 2,
                  minHeight: isMobile ? '48px' : '56px',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ 
                  order: isMobile ? 1 : 2,
                  minHeight: isMobile ? '48px' : '56px',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                İleri
              </Button>
            )}
          </Box>
        )}

        <Box textAlign="center" mt={isMobile ? 3 : 4}>
          <Button
            variant="text"
            onClick={() => navigate('/customer-login')}
            sx={{ 
              color: 'text.secondary',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              minHeight: isMobile ? '36px' : '40px'
            }}
          >
            Zaten hesabınız var mı? Giriş yapın
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerRegister; 