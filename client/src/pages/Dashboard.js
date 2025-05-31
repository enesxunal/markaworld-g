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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Müşteri sayısı
      const customersResponse = await customerAPI.getAll();
      const totalCustomers = customersResponse.data.length;
      
      // Satış verileri
      const salesResponse = await salesAPI.getAll();
      const sales = salesResponse.data;
      
      const activeSales = sales.filter(sale => sale.status === 'approved').length;
      const totalRevenue = sales
        .filter(sale => sale.status === 'approved')
        .reduce((sum, sale) => sum + parseFloat(sale.total_with_interest), 0);
      
      // Son satışlar (son 5)
      const recentSales = sales.slice(0, 5);
      
      setStats({
        totalCustomers,
        activeSales,
        overduePayments: 0, // Bu veri taksitlerden hesaplanacak
        totalRevenue,
      });
      
      setRecentSales(recentSales);
      
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
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

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ana Sayfa
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Hoş geldiniz! Müşteri ödeme takip sisteminiz aktif olarak çalışıyor.
        <Button 
          variant="outlined" 
          size="small" 
          onClick={runDailyChecks}
          sx={{ ml: 2 }}
        >
          Manuel Kontrol Çalıştır
        </Button>
      </Alert>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Müşteri"
            value={stats.totalCustomers}
            icon={<PeopleIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktif Satış"
            value={stats.activeSales}
            icon={<ShoppingCartIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Geciken Ödeme"
            value={stats.overduePayments}
            icon={<WarningIcon fontSize="large" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Ciro"
            value={`${stats.totalRevenue.toLocaleString('tr-TR')}₺`}
            icon={<TrendingUpIcon fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Son Satışlar */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Son Satışlar
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
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
                          <TableCell>
                            {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
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

export default Dashboard; 