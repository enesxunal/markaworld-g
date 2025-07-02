import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExitToApp as ExitToAppIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Payments as PaymentsIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { customerAPI } from '../services/api';
import { format } from 'date-fns';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [error, setError] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      navigate('/customer-login');
      return;
    }

    const parsedCustomer = JSON.parse(customerData);
    if (parsedCustomer.id.toString() !== id) {
      navigate('/customer-login');
      return;
    }

    setCustomer(parsedCustomer);
    loadCustomerData(parsedCustomer.id);
  }, [id, navigate]);

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

  const getInstallmentStatusChip = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return <Chip label="Ödendi" color="success" size="small" />;
    } else if (due < today) {
      return <Chip label="Gecikmiş" color="error" size="small" />;
    } else {
      return <Chip label="Bekliyor" color="warning" size="small" />;
    }
  };

  const handleInstallmentClick = (installment) => {
    setSelectedInstallment(installment);
    setOpenPaymentDialog(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <img src="/logo.png" alt="Marka World" style={{ height: '40px' }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Müşteri Paneli
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
          >
            Çıkış Yap
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Müşteri Bilgileri */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Müşteri Bilgileri
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Ad Soyad</Typography>
                <Typography variant="body1">{customer.name}</Typography>
              </Box>
              
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">TC Kimlik No</Typography>
                <Typography variant="body1">{customer.tc_no}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Telefon</Typography>
                <Typography variant="body1">{customer.phone}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">E-posta</Typography>
                <Typography variant="body1">{customer.email}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Adres</Typography>
                <Typography variant="body1">{customer.address || '-'}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Kredi Limiti</Typography>
                <Typography variant="h6" color="primary">{parseFloat(customer.credit_limit).toLocaleString('tr-TR')}₺</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Mevcut Borç</Typography>
                <Typography variant="h6" color="error">{parseFloat(customer.current_debt || 0).toLocaleString('tr-TR')}₺</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Kullanılabilir Limit</Typography>
                <Typography variant="h6" color="success.main">{(parseFloat(customer.credit_limit) - parseFloat(customer.current_debt || 0)).toLocaleString('tr-TR')}₺</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Taksit Bilgileri */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentsIcon />
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
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>{installment.installment_no}</TableCell>
                        <TableCell>{parseFloat(installment.amount).toLocaleString('tr-TR')}₺</TableCell>
                        <TableCell>{format(new Date(installment.due_date), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>
                          <Chip 
                            label={installment.status === 'paid' ? 'Ödendi' : 'Bekliyor'} 
                            color={installment.status === 'paid' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleInstallmentClick(installment)}
                            disabled={installment.status === 'paid'}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Satış Geçmişi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Satış Geçmişi
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Satış No</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Toplam Tutar</TableCell>
                      <TableCell>Taksit Sayısı</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.id}</TableCell>
                        <TableCell>{format(new Date(sale.created_at), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>{parseFloat(sale.total_amount).toLocaleString('tr-TR')}₺</TableCell>
                        <TableCell>{sale.installment_count} Taksit</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/admin/sales/${sale.id}`)}
                          >
                            Detay
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CustomerDetail; 