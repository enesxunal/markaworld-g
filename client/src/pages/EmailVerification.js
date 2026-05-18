import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  TextField
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Description,
  Security,
  Gavel
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

const steps = ['E-posta Onayı', 'Sözleşme Onayı', 'Hesap Aktif'];

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [agreements, setAgreements] = useState({
    kvkk: false,
    contract: false,
    electronic: false
  });

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError('Geçersiz doğrulama linki');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await customerAPI.verifyEmail(token);

      if (response.data.success) {
        if (response.data.alreadyActive) {
          navigate('/customer-login', {
            state: { message: response.data.message || 'Hesabınız zaten aktif. Giriş yapabilirsiniz.' }
          });
          return;
        }
        setCustomer(response.data.customer);
        setActiveStep(1);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'E-posta onayı başarısız');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  const handleAgreementChange = (type) => {
    setAgreements((prev) => ({
      ...prev,
      [type]: !prev[type]
    }));
    setError('');
  };

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      setResendMessage('Lütfen kayıt sırasında kullandığınız e-posta adresini girin.');
      return;
    }
    try {
      setResendLoading(true);
      setResendMessage('');
      const response = await customerAPI.resendVerification(resendEmail.trim());
      setResendMessage(response.data.message || 'E-posta gönderildi.');
    } catch (err) {
      setResendMessage(err.response?.data?.error || 'E-posta gönderilemedi.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!agreements.kvkk || !agreements.contract || !agreements.electronic) {
      setError('Lütfen tüm sözleşmeleri onaylayın');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await customerAPI.completeRegistration(token, agreements);

      if (response.data.success) {
        setActiveStep(2);
        setTimeout(() => {
          navigate('/customer-login', {
            state: { message: 'Hesabınız başarıyla aktifleştirildi! Giriş yapabilirsiniz.' }
          });
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sözleşme onayı başarısız');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              E-posta onayınız kontrol ediliyor...
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              E-posta Onaylandı!
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Sayın <strong>{customer?.name}</strong>, e-posta adresiniz onaylandı.
              Hesabınızı aktifleştirmek için aşağıdaki sözleşmeleri onaylayın.
            </Alert>

            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security color="primary" />
                KVKK Aydınlatma Metni
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  Kişisel verileriniz satış ve taksit takibi amacıyla işlenir. Detaylar için info@markaworld.com.tr
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.kvkk}
                    onChange={() => handleAgreementChange('kvkk')}
                    color="primary"
                  />
                }
                label="KVKK Aydınlatma Metnini okudum ve onaylıyorum"
              />
            </Paper>

            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description color="primary" />
                Taksitli Satış Sözleşmesi
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  Alıcı: {customer?.name} — TC: {customer?.tc_no} — Limit: {customer?.credit_limit}₺
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.contract}
                    onChange={() => handleAgreementChange('contract')}
                    color="primary"
                  />
                }
                label="Taksitli Satış Sözleşmesini okudum ve onaylıyorum"
              />
            </Paper>

            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Gavel color="primary" />
                Elektronik Onay Metni
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreements.electronic}
                    onChange={() => handleAgreementChange('electronic')}
                    color="primary"
                  />
                }
                label="Elektronik onay metnini okudum ve dijital imza yetkisi veriyorum"
              />
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box textAlign="center">
              <Button
                variant="contained"
                size="large"
                onClick={handleCompleteRegistration}
                disabled={loading || !agreements.kvkk || !agreements.contract || !agreements.electronic}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : 'SÖZLEŞMELERİ ONAYLA VE HESABI AKTİFLEŞTİR'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              Hesabınız Aktifleştirildi!
            </Typography>
            <Typography paragraph>
              Giriş sayfasına yönlendiriliyorsunuz...
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && activeStep === 0 && !error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {renderStepContent()}
        </Paper>
      </Container>
    );
  }

  if (error && activeStep === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign="center">
            <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              E-posta Onayı Başarısız
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>

            <Typography variant="body2" sx={{ mb: 2 }}>
              Yeni doğrulama bağlantısı almak için e-posta adresinizi girin:
            </Typography>
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              sx={{ mb: 2, maxWidth: 400 }}
            />
            {resendMessage && (
              <Alert severity="info" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
                {resendMessage}
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
              </Button>
              <Button variant="contained" onClick={() => navigate('/customer-register')}>
                Yeniden Kayıt Ol
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 4 }}>
          Hesap Onayı — Marka World
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </Paper>
    </Container>
  );
};

export default EmailVerification;
