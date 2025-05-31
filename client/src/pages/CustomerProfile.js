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
  ListItemIcon
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
  Info
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
      return <CheckCircle sx={{ color: 'success.main' }} />;
    } else if (due < today) {
      return <Error sx={{ color: 'error.main' }} />;
    } else {
      return <Warning sx={{ color: 'warning.main' }} />;
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ height: '50px', marginRight: '16px' }}
          />
          <Typography variant="h4" component="h1">
            Müşteri Paneli
          </Typography>
        </Box>
        <Button variant="outlined" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Kişisel Bilgiler */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6">Kişisel Bilgiler</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText primary="Ad Soyad" secondary={customer.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="TC Kimlik No" secondary={customer.tc_no} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Telefon" secondary={customer.phone} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={customer.email} />
                </ListItem>
                {customer.birth_date && (
                  <ListItem>
                    <ListItemText 
                      primary="Doğum Tarihi" 
                      secondary={new Date(customer.birth_date).toLocaleDateString('tr-TR')} 
                    />
                  </ListItem>
                )}
                {customer.address && (
                  <ListItem>
                    <ListItemText primary="Adres" secondary={customer.address} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Kredi Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CreditCard sx={{ mr: 1 }} />
                <Typography variant="h6">Kredi Bilgileri</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Kredi Limiti" 
                    secondary={`${customer.credit_limit?.toLocaleString('tr-TR')}₺`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Mevcut Borç" 
                    secondary={`${customer.current_debt?.toLocaleString('tr-TR') || '0'}₺`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Kullanılabilir Limit" 
                    secondary={`${((customer.credit_limit || 0) - (customer.current_debt || 0)).toLocaleString('tr-TR')}₺`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Hesap Durumu" 
                    secondary={
                      <Chip 
                        label={customer.status === 'active' ? 'Aktif' : 'Pasif'} 
                        color={customer.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Ödeme Bilgileri */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance sx={{ mr: 1 }} />
                <Typography variant="h6">Ödeme Bilgileri</Typography>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Önemli:</strong> Taksit ödemelerinizi aşağıdaki hesap bilgilerine yapabilirsiniz.
                </Typography>
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Şirket Bilgileri</Typography>
                  <Typography variant="body2">MARKA WORLD GİYİM LTD. ŞTİ.</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Banka Bilgileri</Typography>
                  <Typography variant="body2">Türkiye İş Bankası - Merkez Şubesi</Typography>
                  <Typography variant="body2">IBAN: TR12 3456 7890 1234 5678 9012 34</Typography>
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Ödeme yaparken açıklama kısmına TC Kimlik numaranızı yazınız.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Taksit Tablosu */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment sx={{ mr: 1 }} />
                <Typography variant="h6">Taksit Takibi</Typography>
              </Box>
              {installments.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Durum</TableCell>
                        <TableCell>Taksit No</TableCell>
                        <TableCell>Tutar</TableCell>
                        <TableCell>Vade Tarihi</TableCell>
                        <TableCell>Ödeme Tarihi</TableCell>
                        <TableCell>Satış Tutarı</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getInstallmentStatusIcon(installment.status, installment.due_date)}
                              <Chip
                                label={getInstallmentStatusText(installment.status, installment.due_date)}
                                color={getInstallmentStatusColor(installment.status, installment.due_date)}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{installment.installment_number}</TableCell>
                          <TableCell>{installment.amount?.toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>
                            {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            {installment.paid_date 
                              ? new Date(installment.paid_date).toLocaleDateString('tr-TR')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{installment.sale_total?.toLocaleString('tr-TR')}₺</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Henüz taksitli alışverişiniz bulunmuyor.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alışveriş Geçmişi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShoppingCart sx={{ mr: 1 }} />
                <Typography variant="h6">Alışveriş Geçmişi</Typography>
              </Box>
              {sales.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Tutar</TableCell>
                        <TableCell>Taksit Sayısı</TableCell>
                        <TableCell>Faizli Toplam</TableCell>
                        <TableCell>Aylık Ödeme</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>Ödenen/Toplam</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>{sale.total_amount?.toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{sale.installment_count}</TableCell>
                          <TableCell>{sale.total_with_interest?.toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{sale.installment_amount?.toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                sale.status === 'approved' ? 'Onaylandı' :
                                sale.status === 'pending_approval' ? 'Onay Bekliyor' :
                                sale.status === 'completed' ? 'Tamamlandı' : 'İptal'
                              }
                              color={
                                sale.status === 'approved' || sale.status === 'completed' ? 'success' :
                                sale.status === 'pending_approval' ? 'warning' : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {sale.paid_installments || 0} / {sale.total_installments || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Henüz alışveriş geçmişiniz bulunmuyor.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerProfile; 