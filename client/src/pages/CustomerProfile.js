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
  Stack
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
  ExitToApp
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
      
      // Müşteri satışlarını getir
      const salesResponse = await customerAPI.getSales(customerId);
      setSales(salesResponse.data);
      
      // Müşteri taksitlerini getir
      const installmentsResponse = await customerAPI.getInstallments(customerId);
      setInstallments(installmentsResponse.data);
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu');
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
                height: isMobile ? '32px' : '40px'
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
            mb: 2,
            fontSize: '0.8rem'
          }}
        >
          {error}
        </Alert>
      )}

      <Stack spacing={isMobile ? 1.5 : 2}>
        {/* Kişisel ve Kredi Bilgileri */}
        <Grid container spacing={isMobile ? 1.5 : 2}>
          {/* Kişisel Bilgiler */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <Person sx={{ fontSize: '1.2rem' }} />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    Kişisel Bilgiler
                  </Typography>
                </Stack>
                <Stack spacing={isMobile ? 0.5 : 1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Ad Soyad
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {customer.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      TC Kimlik No
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {customer.tc_no}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Telefon
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {customer.phone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {customer.email}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Kredi Bilgileri */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <CreditCard sx={{ fontSize: '1.2rem' }} />
                  <Typography 
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    Kredi Bilgileri
                  </Typography>
                </Stack>
                <Box textAlign="center" py={1}>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    color="primary" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {customer.credit_limit?.toLocaleString('tr-TR')}₺
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Kredi Limitiniz
                  </Typography>
                  <Chip 
                    label={customer.status === 'active' ? 'Aktif' : 'Pasif'}
                    color={customer.status === 'active' ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ödeme Bilgileri */}
        <Card>
          <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <AccountBalance sx={{ fontSize: '1.2rem' }} />
              <Typography 
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                Ödeme Bilgileri
              </Typography>
            </Stack>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 1.5,
                fontSize: '0.75rem',
                '& .MuiAlert-message': {
                  fontSize: '0.75rem'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                Ödeme Talimatları:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                • Ödemelerinizi aşağıdaki IBAN'a yapabilirsiniz<br/>
                • Ödeme açıklamasına TC kimlik numaranızı yazınız<br/>
                • Ödeme makbuzunu WhatsApp ile gönderiniz
              </Typography>
            </Alert>
            <Grid container spacing={isMobile ? 1 : 1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Şirket
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                  MARKA WORLD GİYİM LTD. ŞTİ.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  IBAN
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  TR12 3456 7890 1234 5678 9012 34
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Banka
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                  Türkiye İş Bankası - Merkez Şubesi
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  WhatsApp
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                  0555 123 45 67
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Taksit Tablosu */}
        <Card>
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <Payment sx={{ fontSize: '1.2rem' }} />
              <Typography 
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                Taksit Durumu
              </Typography>
            </Stack>
            
            {installments.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Henüz taksitli alışverişiniz bulunmamaktadır.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: isMobile ? 300 : 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 1 }}>
                        Taksit
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 1 }}>
                        Tutar
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 1 }}>
                        Vade
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 1 }}>
                        Durum
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {installments.map((installment, index) => (
                      <TableRow key={installment.id}>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                          {index + 1}. Taksit
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold', py: 0.5 }}>
                          {installment.amount?.toLocaleString('tr-TR')}₺
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                          {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {getInstallmentStatusIcon(installment.status, installment.due_date)}
                            <Chip
                              label={getInstallmentStatusText(installment.status, installment.due_date)}
                              color={getInstallmentStatusColor(installment.status, installment.due_date)}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: '20px' }}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Alışveriş Geçmişi */}
        <Card>
          <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <ShoppingCart sx={{ fontSize: '1.2rem' }} />
              <Typography 
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                Alışveriş Geçmişi
              </Typography>
            </Stack>
            
            {sales.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                Henüz alışverişiniz bulunmamaktadır.
              </Alert>
            ) : (
              <Grid container spacing={1}>
                {sales.map((sale) => (
                  <Grid item xs={12} sm={6} md={4} key={sale.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                        >
                          {sale.total_amount?.toLocaleString('tr-TR')}₺
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {sale.installment_count} Taksit
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                        </Typography>
                        <Chip
                          label={sale.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                          color={sale.status === 'approved' ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 1, fontSize: '0.65rem' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default CustomerProfile; 