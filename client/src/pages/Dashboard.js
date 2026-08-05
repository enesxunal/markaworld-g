import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { customerAPI, salesAPI, systemAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { BRAND, statCardSx, chipNeutralSx } from '../styles/brand';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeSales: 0,
    overduePayments: 0,
    totalRevenue: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const customersResponse = await customerAPI.getAll();
      const totalCustomers = customersResponse.data.length;
      const salesResponse = await salesAPI.getAll();
      const sales = salesResponse.data;
      const activeSales = sales.filter((sale) => sale.status === 'approved').length;
      const totalRevenue = sales
        .filter((sale) => sale.status === 'approved')
        .reduce((sum, sale) => sum + parseFloat(sale.total_with_interest), 0);
      const recentSalesData = sales.slice(0, 5);
      const upcomingResponse = await salesAPI.getUpcomingInstallments(5);
      setStats({ totalCustomers, activeSales, overduePayments: 0, totalRevenue });
      setRecentSales(recentSalesData);
      setUpcomingPayments(upcomingResponse.data);
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      setLoadError(
        msg.includes('401') || msg.includes('403') || error.response?.status === 401
          ? 'Oturum süresi doldu veya yetkiniz yok. Çıkış yapıp admin olarak tekrar giriş yapın.'
          : `Veriler yüklenemedi: ${msg}`
      );
    } finally {
      setLoading(false);
    }
  };

  const runDailyChecks = async () => {
    try {
      await systemAPI.runDailyChecks();
      alert('Günlük kontroller başarıyla çalıştırıldı!');
    } catch (error) {
      alert('Günlük kontroller çalıştırılamadı!');
    }
  };

  const StatCard = ({ title, value, icon }) => (
    <Card elevation={0} sx={statCardSx}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" sx={{ color: BRAND.warmGray }}>{title}</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: BRAND.black }}>
              {loading ? '...' : value}
            </Typography>
          </Box>
          <Box sx={{ color: BRAND.black, opacity: 0.7 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusChip = (status) => {
    const statusMap = {
      pending_approval: { label: 'Onay Bekliyor', sx: chipNeutralSx },
      approved: { label: 'Onaylandı', sx: { bgcolor: BRAND.successBg, color: BRAND.success, fontWeight: 600 } },
      cancelled: { label: 'İptal', sx: { bgcolor: BRAND.errorBg, color: BRAND.error, fontWeight: 600 } },
    };
    const info = statusMap[status] || { label: status, sx: chipNeutralSx };
    return <Chip label={info.label} size="small" sx={info.sx} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography color="text.secondary">Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Panel"
        subtitle="Müşteri ödeme takip sistemi özeti"
        action={
          <Button variant="outlined" size="small" onClick={runDailyChecks}>
            Manuel Kontrol
          </Button>
        }
      />

      {loadError && <Alert severity="warning" sx={{ mb: 2 }}>{loadError}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        Hoş geldiniz! Sistem aktif olarak çalışıyor.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Toplam Müşteri" value={stats.totalCustomers} icon={<PeopleIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Aktif Satış" value={stats.activeSales} icon={<ShoppingCartIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Geciken Ödeme" value={stats.overduePayments} icon={<WarningIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Toplam Ciro" value={`${stats.totalRevenue.toLocaleString('tr-TR')}₺`} icon={<TrendingUpIcon fontSize="large" />} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Son Satışlar</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Müşteri</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Taksit</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSales.length > 0 ? (
                      recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.customer_name}</TableCell>
                          <TableCell>{parseFloat(sale.total_amount).toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{sale.installment_count} Taksit</TableCell>
                          <TableCell>{getStatusChip(sale.status)}</TableCell>
                          <TableCell>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Henüz satış kaydı bulunmuyor</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Yaklaşan Taksitler (5 Gün)</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Müşteri</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Vade</TableCell>
                      <TableCell>Taksit No</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingPayments.length > 0 ? (
                      upcomingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.customer_name}</TableCell>
                          <TableCell>{parseFloat(payment.amount).toLocaleString('tr-TR')}₺</TableCell>
                          <TableCell>{new Date(payment.due_date).toLocaleDateString('tr-TR')}</TableCell>
                          <TableCell>{payment.installment_number}. Taksit</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">Yaklaşan taksit bulunmuyor</TableCell>
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

export default Dashboard;
