import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import { emailAPI } from '../services/api';
import PublicLayout from '../components/PublicLayout';

const Unsubscribe = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setSnackbar({
        open: true,
        message: 'Lütfen e-posta adresinizi girin',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await emailAPI.unsubscribe(email);
      
      setSnackbar({
        open: true,
        message: 'E-posta aboneliğiniz başarıyla iptal edildi',
        severity: 'success'
      });
      setEmail('');
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <PublicLayout>
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Abonelikten Çık
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }} align="center" color="text.secondary">
            E-posta bültenimizden çıkmak için e-posta adresinizi girin.
          </Typography>
          
          <Box component="form" onSubmit={handleUnsubscribe} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="E-posta Adresi"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{
                bgcolor: 'black',
                '&:hover': {
                  bgcolor: 'grey.900'
                }
              }}
            >
              {loading ? 'İşleniyor...' : 'Abonelikten Çık'}
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </PublicLayout>
  );
};

export default Unsubscribe; 