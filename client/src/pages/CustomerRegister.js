import React, { useState } from 'react';
import {
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
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Home,
  CreditCard,
  CalendarToday,
  CheckCircle,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { customerAPI } from '../services/api';
import AuthShell from '../components/AuthShell';
import SeoHead from '../components/SeoHead';
import { BRAND } from '../styles/brand';
import { SEO_PAGES } from '../seo/siteConfig';

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
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, birth_date: date }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = 'Ad Soyad gerekli';
      if (!formData.tc_no || formData.tc_no.length !== 11) newErrors.tc_no = 'TC Kimlik No 11 haneli olmalı';
      if (!formData.phone.trim()) newErrors.phone = 'Telefon numarası gerekli';
    }
    if (step === 1) {
      if (!formData.email.trim()) newErrors.email = 'E-posta gerekli';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Geçerli bir e-posta girin';
      if (!formData.password.trim()) newErrors.password = 'Şifre gerekli';
      else if (formData.password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalı';
      if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Şifre tekrarı gerekli';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        birth_date: formData.birth_date ? formData.birth_date.format('YYYY-MM-DD') : null,
      };
      const response = await customerAPI.register(submitData);
      if (response.data.success) {
        setEmailSent(response.data.emailSent !== false);
        setActiveStep(2);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach((err) => {
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

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      await customerAPI.resendVerification(formData.email);
      setResendMessage('Doğrulama e-postası tekrar gönderildi.');
    } catch (error) {
      setResendMessage(error.response?.data?.error || 'E-posta gönderilemedi.');
    } finally {
      setResendLoading(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': { minHeight: isMobile ? 48 : 52, bgcolor: BRAND.white },
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Ad Soyad" name="name" value={formData.name} onChange={handleChange}
                error={!!errors.name} helperText={errors.name} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="TC Kimlik Numarası" name="tc_no" value={formData.tc_no} onChange={handleChange}
                error={!!errors.tc_no} helperText={errors.tc_no} inputProps={{ maxLength: 11 }} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><CreditCard sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Telefon Numarası" name="phone" value={formData.phone} onChange={handleChange}
                error={!!errors.phone} helperText={errors.phone} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
                <DatePicker label="Doğum Tarihi" value={formData.birth_date} onChange={handleDateChange} format="DD.MM.YYYY"
                  slotProps={{ textField: { fullWidth: true, sx: fieldSx,
                    InputProps: { startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: BRAND.warmGray }} /></InputAdornment> } } }} />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="E-posta" name="email" type="email" value={formData.email} onChange={handleChange}
                error={!!errors.email} helperText={errors.email} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Şifre" name="password" type="password" value={formData.password} onChange={handleChange}
                error={!!errors.password} helperText={errors.password} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Şifre Tekrar" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Adres" name="address" value={formData.address} onChange={handleChange} multiline rows={2} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: BRAND.warmGray }} /></InputAdornment> }} />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box textAlign="center" py={2}>
            <CheckCircle sx={{ fontSize: 56, color: BRAND.success, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>Kayıt Başarılı</Typography>
            <Typography color="text.secondary" mb={2}>
              {emailSent
                ? 'Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.'
                : 'Kayıt tamamlandı ancak e-posta gönderilemedi. Tekrar deneyebilirsiniz.'}
            </Typography>
            {!emailSent && (
              <Button variant="outlined" onClick={handleResendEmail} disabled={resendLoading} sx={{ mb: 2 }}>
                {resendLoading ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
              </Button>
            )}
            {resendMessage && <Alert severity="info" sx={{ mb: 2 }}>{resendMessage}</Alert>}
            <Button variant="contained" onClick={() => navigate('/customer-login')} sx={{ mt: 1 }}>
              Giriş Sayfasına Git
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <SeoHead
        title={SEO_PAGES.customerRegister.title}
        description={SEO_PAGES.customerRegister.description}
        robots={SEO_PAGES.customerRegister.robots}
        noCanonical
      />
      <AuthShell title="Üyelik Başvurusu" subtitle="Marka World müşteri hesabı oluşturun">
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-label': { fontSize: isMobile ? '0.7rem' : '0.85rem' } }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {errors.general && <Alert severity="error" sx={{ mb: 2 }}>{errors.general}</Alert>}

      <Box>{renderStepContent(activeStep)}</Box>

      {activeStep < 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ flex: 1 }}>
            Geri
          </Button>
          {activeStep === steps.length - 2 ? (
            <Button onClick={handleSubmit} variant="contained" disabled={loading} sx={{ flex: 1, fontWeight: 700 }}>
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained" sx={{ flex: 1, fontWeight: 700 }}>
              İleri
            </Button>
          )}
        </Box>
      )}

      {activeStep < 2 && (
        <Box textAlign="center" mt={3}>
          <Button variant="text" onClick={() => navigate('/customer-login')} sx={{ color: BRAND.warmGray }}>
            Zaten hesabınız var? Giriş yapın
          </Button>
        </Box>
      )}
    </AuthShell>
    </>
  );
};

export default CustomerRegister;
