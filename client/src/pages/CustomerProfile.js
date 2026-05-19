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

// Marka World — siyah / beyaz
const BRAND = {
  black: '#000000',
  white: '#ffffff',
  bg: '#fafafa',
  grey: '#f0f0f0',
  border: '#e0e0e0',
  muted: '#6b6b6b'
};

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
    return {
      label: 'Ödendi',
      icon: <CheckCircle fontSize="small" />,
      chipSx: { borderColor: BRAND.black, color: BRAND.black, bgcolor: BRAND.white }
    };
  }
  if (status === 'overdue' || (status === 'unpaid' && due < today)) {
    return {
      label: 'Gecikmiş',
      icon: <ErrorIcon fontSize="small" />,
      chipSx: { borderColor: BRAND.black, color: BRAND.white, bgcolor: BRAND.black }
    };
  }
  return {
    label: 'Bekliyor',
    icon: <Warning fontSize="small" />,
    chipSx: { borderColor: BRAND.muted, color: BRAND.muted, bgcolor: BRAND.white }
  };
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
    <Box sx={{ bgcolor: BRAND.bg, minHeight: '100vh', pb: 4 }}>
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
          bgcolor: BRAND.black,
          color: BRAND.white,
          py: 3,
          px: 2,
          borderBottom: `3px solid ${BRAND.white}`
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                component="img"
                src="/logo.png"
                alt="Marka World"
                sx={{ height: 40, width: 'auto', display: { xs: 'none', sm: 'block' } }}
              />
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: BRAND.white,
                  color: BRAND.black,
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  border: `2px solid ${BRAND.white}`
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
              variant="outlined"
              onClick={handleLogout}
              startIcon={<ExitToApp />}
              sx={{
                color: BRAND.white,
                borderColor: BRAND.white,
                fontWeight: 600,
                '&:hover': { borderColor: BRAND.grey, bgcolor: 'rgba(255,255,255,0.08)' }
              }}
            >
              Çıkış
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2 }}>
        {loading && (
          <LinearProgress
            sx={{
              mb: 2,
              borderRadius: 1,
              bgcolor: BRAND.grey,
              '& .MuiLinearProgress-bar': { bgcolor: BRAND.black }
            }}
          />
        )}

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
            { title: 'Kredi Limiti', value: formatMoney(stats.creditLimit) },
            { title: 'Mevcut Borç', value: formatMoney(stats.currentDebt) },
            { title: 'Kullanılabilir', value: formatMoney(stats.available) },
            {
              title: 'Sonraki Taksit',
              value: stats.nextDue ? formatDate(stats.nextDue) : 'Yok'
            }
          ].map((item) => (
            <Grid item xs={6} md={3} key={item.title}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${BRAND.border}`,
                  bgcolor: BRAND.white
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.black, mt: 0.5 }}>
                    {loading ? '...' : item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Limit kullanımı */}
        <Card
          elevation={0}
          sx={{ mb: 3, borderRadius: 2, p: 2, border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white }}
        >
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
              bgcolor: BRAND.grey,
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: stats.usagePercent > 80 ? BRAND.black : '#333333'
              }
            }}
          />
          <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
            <Chip
              size="small"
              icon={<CheckCircle />}
              label={`${stats.paidCount} ödendi`}
              variant="outlined"
              sx={{ borderColor: BRAND.black, color: BRAND.black }}
            />
            <Chip
              size="small"
              icon={<Schedule />}
              label={`${stats.pendingCount} bekliyor`}
              variant="outlined"
              sx={{ borderColor: BRAND.muted, color: BRAND.muted }}
            />
            {stats.overdueCount > 0 && (
              <Chip
                size="small"
                icon={<ErrorIcon />}
                label={`${stats.overdueCount} gecikmiş`}
                sx={{ bgcolor: BRAND.black, color: BRAND.white }}
              />
            )}
          </Stack>
        </Card>

        <Grid container spacing={3}>
          {/* Sol: iletişim */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{ borderRadius: 2, height: '100%', border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Hesap Bilgileri
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense disablePadding>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: BRAND.black }}><Phone fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Telefon" secondary={customer?.phone || '-'} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: BRAND.black }}><Email fontSize="small" /></ListItemIcon>
                    <ListItemText primary="E-posta" secondary={customer?.email || '-'} />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 36, color: BRAND.black }}><Badge fontSize="small" /></ListItemIcon>
                    <ListItemText primary="T.C. Kimlik No" secondary={customer?.tc_no || '-'} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 36, color: BRAND.black }}><Home fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Adres" secondary={customer?.address || 'Belirtilmemiş'} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Ödeme bilgileri */}
            <Card
              elevation={0}
              sx={{ borderRadius: 2, mt: 2, border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <AccountBalance sx={{ color: BRAND.black }} />
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
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    mb: 2,
                    borderColor: BRAND.border,
                    bgcolor: BRAND.grey
                  }}
                >
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
                  startIcon={<WhatsApp />}
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    mb: 1,
                    bgcolor: BRAND.black,
                    color: BRAND.white,
                    '&:hover': { bgcolor: '#222' }
                  }}
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
            <Card
              elevation={0}
              sx={{ borderRadius: 2, border: `1px solid ${BRAND.border}`, bgcolor: BRAND.white }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant={isMobile ? 'fullWidth' : 'standard'}
                sx={{
                  borderBottom: 1,
                  borderColor: BRAND.border,
                  px: 1,
                  '& .MuiTab-root': { color: BRAND.muted, fontWeight: 500 },
                  '& .Mui-selected': { color: `${BRAND.black} !important` },
                  '& .MuiTabs-indicator': { bgcolor: BRAND.black, height: 3 }
                }}
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
                                    size="small"
                                    variant="outlined"
                                    sx={meta.chipSx}
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
                                  variant="outlined"
                                  sx={{ borderColor: BRAND.black, color: BRAND.black }}
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
