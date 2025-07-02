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
                      <Person sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
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
                      <CreditCard sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
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
                      <Phone sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
                <DatePicker
                  label="Doğum Tarihi"
                  value={formData.birth_date}
                  onChange={handleDateChange}
                  format="DD.MM.YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.birth_date,
                      helperText: errors.birth_date,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday sx={{ 
                              fontSize: isMobile ? '1.2rem' : '1.5rem',
                              color: 'action.active'
                            }} />
                          </InputAdornment>
                        ),
                      },
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          minHeight: isMobile ? '48px' : '56px',
                          backgroundColor: 'background.paper'
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: isMobile ? '0.7rem' : '0.75rem'
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
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
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
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
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
                      <Lock sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Şifre Tekrar"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: isMobile ? '48px' : '56px',
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                name="address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home sx={{ 
                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                        color: 'action.active'
                      }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }
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
          p: isMobile ? 2 : 4, 
          borderRadius: isMobile ? 2 : 3,
          width: '100%',
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
            Yeni Hesap Oluştur
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
            Marka World'e hoş geldiniz! Lütfen bilgilerinizi girin.
          </Typography>
        </Box>

        <Stepper 
          activeStep={activeStep} 
          alternativeLabel={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{ 
            mb: isMobile ? 3 : 4,
            '& .MuiStepLabel-label': {
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.general && (
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
            {errors.general}
          </Alert>
        )}

        {activeStep === 2 ? (
          <Box textAlign="center">
            <CheckCircle 
              color="success" 
              sx={{ 
                fontSize: isMobile ? '64px' : '96px',
                mb: 2
              }} 
            />
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Kayıt Başarılı!
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/customer-login')}
              size={isMobile ? "medium" : "large"}
              sx={{ 
                minWidth: 200,
                py: isMobile ? 1 : 1.5,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  opacity: 0.9
                }
              }}
            >
              Giriş Yap
            </Button>
          </Box>
        ) : (
          <>
            {renderStepContent(activeStep)}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: isMobile ? 3 : 4,
              gap: 2
            }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                size={isMobile ? "medium" : "large"}
                sx={{ 
                  minWidth: '120px',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Geri
              </Button>
              <Button
                variant="contained"
                onClick={activeStep === 1 ? handleSubmit : handleNext}
                size={isMobile ? "medium" : "large"}
                disabled={loading}
                sx={{ 
                  minWidth: '120px',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    opacity: 0.9
                  }
                }}
              >
                {activeStep === 1 ? (loading ? 'Kaydediliyor...' : 'Kaydet') : 'İleri'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerRegister; 