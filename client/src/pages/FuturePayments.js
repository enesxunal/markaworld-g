import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { salesAPI } from '../services/api';
import { Payment as PaymentIcon } from '@mui/icons-material';

const FuturePayments = () => {
  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState({
    paid: 0,
    unpaid: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, 'month'));
  const [status, setStatus] = useState('all');
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDate, setPaymentDate] = useState(dayjs());

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setPaymentDate(dayjs());
    setOpenPaymentDialog(true);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      await salesAPI.payInstallment(
        selectedPayment.sale_id,
        selectedPayment.installment_id,
        { payment_date: paymentDate.format('YYYY-MM-DD') }
      );

      // Ödeme başarılı, listeyi güncelle
      fetchPayments();
      setOpenPaymentDialog(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      console.log('🔍 [FRONTEND] fetchPayments çağrıldı');
      setLoading(true);
      setError(null);

      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        status
      };
      console.log('🔍 [FRONTEND] API parametreleri:', params);

      const response = await salesAPI.getFuturePayments(params);
      console.log('🔍 [FRONTEND] API yanıtı:', response);
      console.log('🔍 [FRONTEND] API data:', response.data);
      console.log('🔍 [FRONTEND] Payments array:', response.data.payments);
      console.log('🔍 [FRONTEND] Payments length:', response.data.payments.length);
      console.log('🔍 [FRONTEND] First payment:', response.data.payments[0]);
      console.log('🔍 [FRONTEND] Totals:', response.data.totals);
      
      // Tüm taksitlerin detaylarını logla
      console.log('🔍 [FRONTEND] Tüm taksitler:');
      response.data.payments.forEach((payment, index) => {
        console.log(`🔍 [FRONTEND] Taksit ${index + 1}:`, {
          id: payment.installment_id,
          amount: payment.amount,
          due_date: payment.due_date,
          status: payment.status,
          installment_number: payment.installment_number,
          sale_id: payment.sale_id,
          customer_name: payment.customer_name
        });
      });
      
      setPayments(response.data.payments);
      setTotals(response.data.totals || {
        paid: 0,
        unpaid: 0,
        overdue: 0
      });
    } catch (error) {
      console.error('🔍 [FRONTEND] Hata:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [startDate, endDate, status]);

  const getStatusColor = (status, dueDate) => {
    if (status === 'paid') return 'success';
    if (status === 'unpaid') {
      return dayjs(dueDate).isBefore(dayjs(), 'day') ? 'error' : 'warning';
    }
    return 'default';
  };

  const getStatusText = (status, dueDate) => {
    if (status === 'paid') return 'Ödendi';
    if (status === 'unpaid') {
      return dayjs(dueDate).isBefore(dayjs(), 'day') ? 'Gecikmiş' : 'Ödenmedi';
    }
    return status;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Toplam Ödenmiş
                </Typography>
                <Typography variant="h4" color="success.main">
                  {totals.paid?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Toplam Ödenmemiş
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {totals.unpaid?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Toplam Gecikmiş
                </Typography>
                <Typography variant="h4" color="error.main">
                  {totals.overdue?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Başlangıç Tarihi"
              value={startDate}
              onChange={setStartDate}
              format="DD.MM.YYYY"
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Bitiş Tarihi"
              value={endDate}
              onChange={setEndDate}
              format="DD.MM.YYYY"
              slotProps={{
                textField: { fullWidth: true }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Durum">
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="paid">Ödenenler</MenuItem>
                <MenuItem value="unpaid">Ödenmeyenler</MenuItem>
                <MenuItem value="overdue">Gecikmiş</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Müşteri</TableCell>
                <TableCell>Taksit No</TableCell>
                <TableCell>Vade Tarihi</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.installment_id}>
                  <TableCell>{payment.customer_name}</TableCell>
                  <TableCell>{payment.installment_number}</TableCell>
                  <TableCell>
                    {dayjs(payment.due_date).format('DD.MM.YYYY')}
                  </TableCell>
                  <TableCell>
                    {payment.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(payment.status, payment.due_date)}
                      color={getStatusColor(payment.status, payment.due_date)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {payment.status === 'paid' ? (
                      <Typography color="success.main" fontWeight={600}>Ödendi</Typography>
                    ) : (
                      <IconButton
                        color="primary"
                        onClick={() => handlePaymentClick(payment)}
                        title="Ödeme Al"
                      >
                        <PaymentIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
          <DialogTitle>Ödeme Al</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography>
                <strong>Müşteri:</strong> {selectedPayment?.customer_name}
              </Typography>
              <Typography>
                <strong>Tutar:</strong>{' '}
                {selectedPayment?.amount.toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                })}
              </Typography>
              <DatePicker
                label="Ödeme Tarihi"
                value={paymentDate}
                onChange={setPaymentDate}
                format="DD.MM.YYYY"
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaymentDialog(false)}>İptal</Button>
            <Button onClick={handlePayment} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Ödeme Al'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
};

export default FuturePayments; 