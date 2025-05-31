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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { salesAPI } from '../services/api';

function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(id);
      setSale(response.data);
    } catch (error) {
      console.error('Satış detayı yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      await salesAPI.payInstallment(sale.id, selectedInstallment.id, {
        payment_date: paymentDate
      });
      
      setPaymentDialog(false);
      setSelectedInstallment(null);
      loadSale();
      alert('Ödeme başarıyla kaydedildi!');
    } catch (error) {
      console.error('Ödeme kaydedilemedi:', error);
      alert('Hata: ' + (error.response?.data?.error || 'Ödeme kaydedilemedi'));
    }
  };

  const openPaymentDialog = (installment) => {
    setSelectedInstallment(installment);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentDialog(true);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'pending_approval': { label: 'Onay Bekliyor', color: 'warning' },
      'approved': { label: 'Onaylandı', color: 'success' },
      'cancelled': { label: 'İptal', color: 'error' },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  const getInstallmentStatusChip = (status, lateDays = 0) => {
    const statusMap = {
      'unpaid': { label: lateDays > 0 ? `${lateDays} gün gecikme` : 'Ödenmedi', color: lateDays > 0 ? 'error' : 'warning' },
      'paid': { label: 'Ödendi', color: 'success' },
      'overdue': { label: `${lateDays} gün gecikme`, color: 'error' },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box>
        <Typography variant="h6">Satış bulunamadı</Typography>
        <Button onClick={() => navigate('/sales')} startIcon={<ArrowBackIcon />}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Satış Detayı #{sale.id}
        </Typography>
        {getStatusChip(sale.status)}
      </Box>

      <Grid container spacing={3}>
        {/* Satış Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Satış Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Müşteri
                  </Typography>
                  <Typography variant="body1">
                    {sale.customer_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Telefon
                  </Typography>
                  <Typography variant="body1">
                    {sale.customer_phone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Ana Para
                  </Typography>
                  <Typography variant="h6">
                    {parseFloat(sale.total_amount).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Faiz Oranı
                  </Typography>
                  <Typography variant="h6">
                    %{sale.interest_rate}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Faizli Toplam
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {parseFloat(sale.total_with_interest).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Taksit Sayısı
                  </Typography>
                  <Typography variant="h6">
                    {sale.installment_count}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Aylık Ödeme
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {parseFloat(sale.installment_amount).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    İlk Ödeme Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {new Date(sale.first_payment_date).toLocaleDateString('tr-TR')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Satış Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </Grid>
                {sale.approved_at && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Onay Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {new Date(sale.approved_at).toLocaleDateString('tr-TR')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Ödeme Durumu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ödeme Durumu
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Ödenen Taksit
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {sale.installments?.filter(i => i.status === 'paid').length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Kalan Taksit
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {sale.installments?.filter(i => i.status !== 'paid').length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Ödenen Tutar
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {(sale.installments?.filter(i => i.status === 'paid').length * parseFloat(sale.installment_amount) || 0).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Kalan Tutar
                  </Typography>
                  <Typography variant="h5" color="error">
                    {(sale.installments?.filter(i => i.status !== 'paid').length * parseFloat(sale.installment_amount) || 0).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Taksit Tablosu */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Taksit Detayları
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taksit No</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Vade Tarihi</TableCell>
                      <TableCell>Ödeme Tarihi</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.installments && sale.installments.length > 0 ? (
                      sale.installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell>{installment.installment_number}</TableCell>
                          <TableCell>{parseFloat(installment.amount).toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>
                            {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            {installment.paid_date 
                              ? new Date(installment.paid_date).toLocaleDateString('tr-TR')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {getInstallmentStatusChip(installment.status, installment.late_days)}
                          </TableCell>
                          <TableCell>
                            {installment.status === 'unpaid' || installment.status === 'overdue' ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<PaymentIcon />}
                                onClick={() => openPaymentDialog(installment)}
                                disabled={sale.status !== 'approved'}
                              >
                                Öde
                              </Button>
                            ) : (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Ödendi"
                                color="success"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Taksit bilgisi bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ödeme Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)}>
        <DialogTitle>Taksit Ödemesi</DialogTitle>
        <DialogContent>
          {selectedInstallment && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Taksit No:</strong> {selectedInstallment.installment_number}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tutar:</strong> {parseFloat(selectedInstallment.amount).toLocaleString('tr-TR')}₺
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Vade Tarihi:</strong> {new Date(selectedInstallment.due_date).toLocaleDateString('tr-TR')}
              </Typography>
              <TextField
                fullWidth
                label="Ödeme Tarihi"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>İptal</Button>
          <Button onClick={handlePayment} variant="contained">
            Ödemeyi Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SaleDetail; 