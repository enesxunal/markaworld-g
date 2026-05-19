import React, { useState, useEffect, useMemo } from 'react';
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
  Snackbar,
  LinearProgress,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExitToApp,
  Phone,
  Email,
  Badge,
  Home,
  ContentCopy,
  AccountBalance,
  Schedule,
  ShoppingBag,
  WhatsApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

const IBAN = 'TR48 0011 1000 0000 0137 1441 61';
const COMPANY_NAME = '3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi';
const WHATSAPP = '905368324660';

const formatMoney = (value) =>
  (parseFloat(value) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('tr-TR') : '-';

const getInstallmentMeta = (installment) => {
  const status = installment.display_status || installment.status;
  const due = new Date(installment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (status === 'paid') {
    return { label: 'Ödendi', color: 'success', icon: <CheckCircle fontSize="small" /> };
  }
  if (status === 'overdue' || (status === 'unpaid' && due < today)) {
    return { label: 'Gecikmiş', color: 'error', icon: <ErrorIcon fontSize="small" /> };
  }
  return { label: 'Bekliyor', color: 'warning', icon: <Warning fontSize="small" /> };
};

const CustomerProfile = () => {
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    const customerToken = localStorage.getItem('customerToken');

    if (!customerData) {
      navigate('/customer-login');
      return;
    }

    if (!customerToken) {
      localStorage.removeItem('customer');
      navigate('/customer-login', {
        state: { message: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.' }
      });
      return;
    }

    setCustomer(JSON.parse(customerData));
    loadCustomerData();
  }, [navigate]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileRes, salesRes, installmentsRes] = await Promise.all([
        customerAPI.getMe(),
        customerAPI.getMySales(),
        customerAPI.getMyInstallments()
      ]);

      setCustomer(profileRes.data);
      localStorage.setItem('customer', JSON.stringify(profileRes.data));
      setSales(salesRes.data || []);
      setInstallments(installmentsRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Veriler yüklenemedi';
      setError(msg);
      if (err.response?.status === 401) {
        localStorage.removeItem('customer');
        localStorage.removeItem('customerToken');
        navigate('/customer-login', { state: { message: 'Lütfen tekrar giriş yapın.' } });
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const paid = installments.filter((i) => (i.display_status || i.status) === 'paid');
    const pending = installments.filter((i) => (i.display_status || i.status) !== 'paid');
    const overdue = installments.filter((i) => (i.display_status || i.status) === 'overdue');
    const nextDue = pending
      .map((i) => new Date(i.due_date))
      .sort((a, b) => a - b)[0];

    const creditLimit = parseFloat(customer?.credit_limit) || 0;
    const currentDebt = parseFloat(customer?.current_debt) || 0;

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      overdueCount: overdue.length,
      nextDue,
      creditLimit,
      currentDebt,
      available: Math.max(creditLimit - currentDebt, 0),
      usagePercent: creditLimit > 0 ? Math.min((currentDebt / creditLimit) * 100, 100) : 0
    };
  }, [installments, customer]);

  const handleLogout = () => {
    localStorage.removeItem('customer');
    localStorage.removeItem('customerToken');
    navigate('/customer-login');
  };

  const handleCopy = (text, message) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  if (!customer && !loading) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', pb: 4 }}>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Üst banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%)',
          color: 'white',
          py: 3,
          px: 2
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.4rem',
                  fontWeight: 700
                }}
              >
                {customer?.name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.85 }}>
                  Marka World Müşteri Paneli
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {loading ? <Skeleton width={160} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : customer?.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {customer?.email}
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              color="inherit"
              onClick={handleLogout}
              startIcon={<ExitToApp />}
              sx={{ color: '#1a237e', fontWeight: 600 }}
            >
              Çıkış
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2 }}>
        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={
            <Button color="inherit" size="small" onClick={loadCustomerData}>Yenile</Button>
          }>
            {error}
          </Alert>
        )}

        {/* Özet kartlar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { title: 'Kredi Limiti', value: formatMoney(stats.creditLimit), color: 'primary.main' },
            { title: 'Mevcut Borç', value: formatMoney(stats.currentDebt), color: 'error.main' },
            { title: 'Kullanılabilir', value: formatMoney(stats.available), color: 'success.main' },
            {
              title: 'Sonraki Taksit',
              value: stats.nextDue ? formatDate(stats.nextDue) : 'Yok',
              color: 'text.primary'
            }
          ].map((item) => (
            <Grid item xs={6} md={3} key={item.title}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: item.color, mt: 0.5 }}>
                    {loading ? '...' : item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Limit kullanımı */}
        <Card elevation={2} sx={{ mb: 3, borderRadius: 2, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Limit kullanımı
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              %{stats.usagePercent.toFixed(0)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={stats.usagePercent}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#e8eaf6',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: stats.usagePercent > 80 ? 'error.main' : 'primary.main'
              }
            }}
          />
          <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
            <Chip size="small" icon={<CheckCircle />} label={`${stats.paidCount} ödendi`} color="success" variant="outlined" />
            <Chip size="small" icon={<Schedule />} label={`${stats.pendingCount} bekliyor`} color="warning" variant="outlined" />
            {stats.overdueCount > 0 && (
              <Chip size="small" icon={<ErrorIcon />} label={`${stats.overdueCount} gecikmiş`} color="error" />
            )}
          </Stack>
        </Card>

        <Grid container spacing={3}>
          {/* Sol: iletişim */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Hesap Bilgileri
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense disablePadding>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Phone color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Telefon" secondary={customer?.phone || '-'} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Email color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="E-posta" secondary={customer?.email || '-'} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><Badge color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="T.C. Kimlik No" secondary={customer?.tc_no || '-'} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36 }}><Home color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Adres" secondary={customer?.address || 'Belirtilmemiş'} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Ödeme bilgileri */}
            <Card elevation={2} sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <AccountBalance color="primary" />
                  <Typography variant="h6" fontWeight={600}>Ödeme Bilgileri</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">Alıcı</Typography>
                <Stack direction="row" alignItems="center" mb={2}>
                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                    {COMPANY_NAME}
                  </Typography>
                  <IconButton size="small" onClick={() => handleCopy(COMPANY_NAME, 'Firma adı kopyalandı')}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="caption" color="text.secondary">IBAN</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, fontFamily: 'monospace', fontSize: '0.85rem', mb: 2 }}>
                  <Stack direction="row" alignItems="center">
                    <Box sx={{ flex: 1, wordBreak: 'break-all' }}>{IBAN}</Box>
                    <IconButton size="small" onClick={() => handleCopy(IBAN.replace(/\s/g, ''), 'IBAN kopyalandı')}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<WhatsApp />}
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mb: 1 }}
                >
                  Dekont Gönder (WhatsApp)
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  Ödeme sonrası dekontu bu kanaldan iletebilirsiniz
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Sağ: sekmeler */}
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant={isMobile ? 'fullWidth' : 'standard'}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
              >
                <Tab label={`Taksitler (${installments.length})`} />
                <Tab label={`Satışlar (${sales.length})`} />
              </Tabs>

              {tab === 0 && (
                <CardContent>
                  <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Tutar</TableCell>
                          <TableCell>Vade</TableCell>
                          <TableCell>Durum</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {installments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography color="text.secondary" py={3}>
                                Henüz taksit kaydı yok
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          installments.map((inst) => {
                            const meta = getInstallmentMeta(inst);
                            return (
                              <TableRow key={inst.id} hover>
                                <TableCell>{inst.installment_number}</TableCell>
                                <TableCell>{formatMoney(inst.amount)}</TableCell>
                                <TableCell>{formatDate(inst.due_date)}</TableCell>
                                <TableCell>
                                  <Chip
                                    icon={meta.icon}
                                    label={meta.label}
                                    color={meta.color}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              )}

              {tab === 1 && (
                <CardContent>
                  <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Satış</TableCell>
                          <TableCell>Tarih</TableCell>
                          <TableCell>Tutar</TableCell>
                          <TableCell>Taksit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography color="text.secondary" py={3}>
                                Henüz satış kaydı yok
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sales.map((sale) => (
                            <TableRow key={sale.id} hover>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <ShoppingBag fontSize="small" color="action" />
                                  <span>#{sale.id}</span>
                                </Stack>
                              </TableCell>
                              <TableCell>{formatDate(sale.created_at)}</TableCell>
                              <TableCell>{formatMoney(sale.total_with_interest || sale.total_amount)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={`${sale.paid_installments || 0}/${sale.total_installments || sale.installment_count}`}
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CustomerProfile;
