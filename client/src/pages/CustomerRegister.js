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
  StepLabel
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
          <Grid container spacing={3}>
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
                      <Person />
                    </InputAdornment>
                  ),
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
                      <CreditCard />
                    </InputAdornment>
                  ),
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
                placeholder="05551234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
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
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Adresi"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email || 'Hesap onayı için email adresinize link gönderilecek'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Şifre"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || 'En az 6 karakter'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres (İsteğe Bağlı)"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <Home />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {errors.general && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.general}</Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Kayıt sonrası:</strong>
                  <br />• Email adresinize onay linki gönderilecek
                  <br />• Onay sonrası 5.000₺ kredi limitiniz aktif olacak
                  <br />• Email ve şifre ile giriş yapabileceksiniz
                  <br />• Taksitli alışveriş yapabileceksiniz
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box textAlign="center">
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Kayıt Başarılı!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Sayın <strong>{formData.name}</strong>, kayıt işleminiz tamamlandı.
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Email adresinize ({formData.email}) hesap onay linki gönderildi. 
              Lütfen email'inizi kontrol edin ve onay linkine tıklayın.
            </Alert>
            <Typography variant="body2" color="text.secondary" paragraph>
              Email onayından sonra email adresiniz ve şifreniz ile giriş yapabilirsiniz.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={4}>
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ height: '60px', marginBottom: '20px' }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Yeni Hesap Oluştur
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Taksitli alışveriş için hesap oluşturun
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          {activeStep === 0 ? (
            <Button
              variant="outlined"
              onClick={() => navigate('/customer-login')}
            >
              Giriş Sayfasına Dön
            </Button>
          ) : activeStep < 2 ? (
            <Button onClick={handleBack}>
              Geri
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => navigate('/customer-login')}
            >
              Giriş Sayfasına Git
            </Button>
          )}

          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              İleri
            </Button>
          )}

          {activeStep === 1 && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerRegister; 