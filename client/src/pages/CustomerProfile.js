import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  IconButton,
  Stack,
  Link,
  Avatar,
  Snackbar
} from '@mui/material';
import {
  Person,
  CreditCard,
  AccountBalance,
  CheckCircle,
  Warning,
  Error,
  ShoppingCart,
  Payment,
  Info,
  ExitToApp,
  Phone,
  Email,
  Badge,
  Home,
  ContentCopy
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

const CustomerProfile = () => {
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      navigate('/customer-login');
      return;
    }

    const parsedCustomer = JSON.parse(customerData);
    setCustomer(parsedCustomer);
    loadCustomerData(parsedCustomer.id);
  }, [navigate]);

  const loadCustomerData = async (customerId) => {
    try {
      setLoading(true);
      
      // Güncel müşteri bilgilerini getir
      const customerResponse = await customerAPI.getById(customerId);
      setCustomer(customerResponse.data);
      
      // Müşteri satışlarını getir
      const salesResponse = await customerAPI.getSales(customerId);
      setSales(salesResponse.data);
      
      // Müşteri taksitlerini getir
      const installmentsResponse = await customerAPI.getInstallments(customerId);
      setInstallments(installmentsResponse.data);
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer');
    navigate('/customer-login');
  };

  const getInstallmentStatusIcon = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return <CheckCircle sx={{ color: 'success.main', fontSize: '1rem' }} />;
    } else if (due < today) {
      return <Error sx={{ color: 'error.main', fontSize: '1rem' }} />;
    } else {
      return <Warning sx={{ color: 'warning.main', fontSize: '1rem' }} />;
    }
  };

  const getInstallmentStatusText = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return 'Ödendi';
    } else if (due < today) {
      return 'Gecikmiş';
    } else {
      return 'Bekliyor';
    }
  };

  const getInstallmentStatusColor = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return 'success';
    } else if (due < today) {
      return 'error';
    } else {
      return 'warning';
    }
  };

  const getInstallmentStatus = (status) => {
    if (status === 'paid') {
      return 'Ödendi';
    } else if (status === 'overdue') {
      return 'Gecikmiş';
    } else {
      return 'Bekliyor';
    }
  };

  const formatCurrency = (value) => {
    return `₺${value.toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const handleCopy = (text, message) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: isMobile ? 1 : 3,
        px: isMobile ? 0.5 : 2,
        minHeight: '100vh'
      }}
    >
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Header */}
      <Paper 
        elevation={1}
        sx={{ 
          p: isMobile ? 1.5 : 2, 
          mb: isMobile ? 1.5 : 2,
          borderRadius: isMobile ? 1 : 2
        }}
      >
        <Stack 
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between" 
          alignItems={isMobile ? "stretch" : "center"}
          spacing={isMobile ? 1.5 : 2}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <img 
              src="/logo.png" 
              alt="Marka World" 
              style={{ 
                height: isMobile ? '32px' : '40px',
                width: 'auto'
              }}
            />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="h1"
              sx={{ fontWeight: 'bold' }}
            >
              Müşteri Paneli
            </Typography>
          </Stack>
          <Button 
            variant={isMobile ? "contained" : "outlined"}
            onClick={handleLogout}
            size={isMobile ? "small" : "medium"}
            startIcon={<ExitToApp />}
            sx={{ 
              minWidth: isMobile ? '100%' : 'auto',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}
          >
            Çıkış Yap
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Müşteri Bilgileri Kartı */}
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={1}
            sx={{ 
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="h2" 
                sx={{ mb: 2, fontWeight: 500 }}
              >
                {customer.name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <List>
                <ListItem disablePadding sx={{ mb: 1.5 }}>
                  <ListItemIcon>
                    <Phone sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Telefon"
                    secondary={
                      <Link
                        href="https://wa.me/905368324660"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: 'text.primary',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.main'
                          }
                        }}
                      >
                        0536 832 46 60
                      </Link>
                    }
                  />
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1.5 }}>
                  <ListItemIcon>
                    <Email sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="E-posta"
                    secondary={customer.email}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1.5 }}>
                  <ListItemIcon>
                    <Badge sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="T.C. Kimlik No"
                    secondary={customer.tc_no}
                  />
                </ListItem>

                <ListItem disablePadding>
                  <ListItemIcon>
                    <Home sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Adres"
                    secondary={customer.address || "Belirtilmemiş"}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Ödeme Bilgileri Kartı */}
        <Grid item xs={12} md={8}>
          <Card 
            elevation={1}
            sx={{ 
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 500, color: 'primary.main', mb: 3 }}
              >
                Ödeme Bilgileri
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom 
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  Banka Bilgileri
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mr: 1 }}>
                    3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi
                  </Typography>
                  <IconButton 
                    size="small"
                    onClick={() => handleCopy('3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi', 'Firma adı kopyalandı')}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: '#f8f9fa',
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      mr: 1
                    }}
                  >
                    TR48 0011 1000 0000 0137 1441 61
                  </Typography>
                  <IconButton 
                    size="small"
                    onClick={() => handleCopy('TR48 0011 1000 0000 0137 1441 61', 'IBAN kopyalandı')}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  Dekont İletişim
                </Typography>
                <Typography variant="body1">
                  Ödeme yaptıktan sonra dekontu WhatsApp üzerinden iletebilirsiniz:
                  <Link
                    href="https://wa.me/905368324660"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      display: 'block',
                      mt: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.main'
                      }
                    }}
                  >
                    0536 832 46 60
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Taksit Tablosu */}
        <Grid item xs={12}>
          <Card 
            elevation={1}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 500, color: 'primary.main', mb: 3 }}
              >
                Taksit Bilgileri
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taksit No</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Vade Tarihi</TableCell>
                      <TableCell>Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {installments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body1" color="text.secondary">
                            Henüz taksit bulunmuyor
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell>{installment.installment_number}</TableCell>
                          <TableCell>{formatCurrency(installment.amount)}</TableCell>
                          <TableCell>{formatDate(installment.due_date)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getInstallmentStatus(installment.status)} 
                              color={getInstallmentStatusColor(installment.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Satış Tablosu */}
        <Grid item xs={12}>
          <Card 
            elevation={1}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 500, color: 'primary.main', mb: 3 }}
              >
                Satış Geçmişi
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Satış No</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Toplam Tutar</TableCell>
                      <TableCell>Detay</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body1" color="text.secondary">
                            Henüz satış bulunmuyor
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.id}</TableCell>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                          <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/sales/${sale.id}`)}
                            >
                              Detay
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Finansal Durum Kartı */}
        <Grid item xs={12}>
          <Card 
            elevation={1}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)'
            }}
          >
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="h2" 
                gutterBottom
                sx={{ fontWeight: 500, color: 'primary.main', mb: 3 }}
              >
                Finansal Durum
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Kredi Limiti
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {parseFloat(customer.credit_limit).toLocaleString('tr-TR')}₺
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mevcut Borç
                    </Typography>
                    <Typography variant="h6" color="error" sx={{ mt: 1 }}>
                      {parseFloat(customer.current_debt || 0).toLocaleString('tr-TR')}₺
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Kullanılabilir Limit
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                      {(parseFloat(customer.credit_limit) - parseFloat(customer.current_debt || 0)).toLocaleString('tr-TR')}₺
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerProfile; 