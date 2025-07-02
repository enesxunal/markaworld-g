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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { salesAPI } from '../services/api';

function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
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

  const handleDelete = async () => {
    try {
      await salesAPI.delete(sale.id);
      setDeleteDialog(false);
      navigate('/admin/sales', { state: { message: 'Satış başarıyla silindi' } });
    } catch (error) {
      console.error('Satış silinemedi:', error);
      alert('Hata: ' + (error.response?.data?.error || 'Satış silinemedi'));
    }
  };

  const openPaymentDialog = (installment) => {
    setSelectedInstallment(installment);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentDialog(true);
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'approved': { label: 'Aktif', color: 'success' },
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
        <Button onClick={() => navigate('/admin/sales')} startIcon={<ArrowBackIcon />}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin/sales')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Satış Detayı #{sale.id}
        </Typography>
        {getStatusChip(sale.status)}
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialog(true)}
          sx={{ ml: 2 }}
        >
          Sil
        </Button>
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
                    Oluşturulma Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Taksit Tablosu */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Taksit Tablosu
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taksit No</TableCell>
                      <TableCell>Vade Tarihi</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell align="right">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.installments?.map((installment) => {
                      const dueDate = new Date(installment.due_date);
                      const today = new Date();
                      const diffTime = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
                      const isLate = diffTime > 0 && installment.status === 'unpaid';

                      return (
                        <TableRow key={installment.id}>
                          <TableCell>{installment.installment_number}</TableCell>
                          <TableCell>
                            {new Date(installment.due_date).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell align="right">
                            {parseFloat(installment.amount).toLocaleString('tr-TR')}₺
                          </TableCell>
                          <TableCell>
                            {getInstallmentStatusChip(installment.status, isLate ? diffTime : 0)}
                          </TableCell>
                          <TableCell align="right">
                            {installment.status === 'unpaid' && (
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => openPaymentDialog(installment)}
                              >
                                <PaymentIcon />
                              </IconButton>
                            )}
                            {installment.status === 'paid' && (
                              <Typography variant="caption" color="success.main">
                                Ödeme Yapıldı
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ödeme Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)}>
        <DialogTitle>Ödeme Kaydet</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              label="Ödeme Tarihi"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>İptal</Button>
          <Button onClick={handlePayment} color="primary">
            Ödemeyi Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Satışı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            Bu satışı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SaleDetail; 