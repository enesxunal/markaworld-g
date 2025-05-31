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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { customerAPI } from '../services/api';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getById(id);
      setCustomer(response.data);
    } catch (error) {
      console.error('Müşteri detayı yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncreaseLimit = async () => {
    if (window.confirm('Müşterinin kredi limitini artırmak istediğinizden emin misiniz?')) {
      try {
        await customerAPI.increaseLimit(id);
        loadCustomer();
        alert('Kredi limiti başarıyla artırıldı!');
      } catch (error) {
        console.error('Limit artırılamadı:', error);
        alert('Hata: ' + (error.response?.data?.error || 'Limit artırılamadı'));
      }
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box>
        <Typography variant="h6">Müşteri bulunamadı</Typography>
        <Button onClick={() => navigate('/customers')} startIcon={<ArrowBackIcon />}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {customer.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mr: 2 }}
        >
          Düzenle
        </Button>
        <Button
          variant="contained"
          startIcon={<TrendingUpIcon />}
          onClick={handleIncreaseLimit}
          color="success"
        >
          Limit Artır
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Müşteri Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Müşteri Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    TC Kimlik No
                  </Typography>
                  <Typography variant="body1">
                    {customer.tc_no}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Telefon
                  </Typography>
                  <Typography variant="body1">
                    {customer.phone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {customer.email || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Doğum Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {customer.birth_date ? new Date(customer.birth_date).toLocaleDateString('tr-TR') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Adres
                  </Typography>
                  <Typography variant="body1">
                    {customer.address || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Kayıt Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Durum
                  </Typography>
                  <Typography variant="body1">
                    {customer.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Finansal Bilgiler */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Finansal Durum
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Kredi Limiti
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {parseFloat(customer.credit_limit).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Mevcut Borç
                  </Typography>
                  <Typography variant="h5" color="error">
                    {parseFloat(customer.current_debt).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Kullanılabilir Limit
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {(parseFloat(customer.credit_limit) - parseFloat(customer.current_debt)).toLocaleString('tr-TR')}₺
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Satış Geçmişi */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Satış Geçmişi
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/sales/new', { state: { selectedCustomer: customer } })}
                >
                  Yeni Satış
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Satış ID</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Taksit</TableCell>
                      <TableCell>Ödenen/Toplam</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.sales && customer.sales.length > 0 ? (
                      customer.sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>#{sale.id}</TableCell>
                          <TableCell>{parseFloat(sale.total_amount).toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{sale.installment_count} Taksit</TableCell>
                          <TableCell>
                            {sale.paid_installments}/{sale.total_installments}
                          </TableCell>
                          <TableCell>{getStatusChip(sale.status)}</TableCell>
                          <TableCell>
                            {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/sales/${sale.id}`)}
                              title="Detay"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Henüz satış kaydı bulunmuyor
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
    </Box>
  );
}

export default CustomerDetail; 