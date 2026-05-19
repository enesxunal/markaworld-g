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
  useMediaQuery,
  IconButton,
  Stack,
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
  WhatsApp,
  CreditCard,
  TrendingDown,
  AccountBalanceWallet,
  Event
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { customerAPI } from '../services/api';

const IBAN = 'TR48 0011 1000 0000 0137 1441 61';
const COMPANY_NAME = '3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi';
const WHATSAPP = '905368324660';

const C = {
  black: '#111111',
  white: '#ffffff',
  pageBg: '#f3f4f6',
  card: '#ffffff',
  border: '#e5e7eb',
  muted: '#6b7280',
  headerBg: '#0a0a0a',
  green: '#16a34a',
  greenBg: '#dcfce7',
  amber: '#d97706',
  amberBg: '#fef3c7',
  red: '#dc2626',
  redBg: '#fee2e2',
  whatsapp: '#25D366'
};

const formatMoney = (value) =>
  (parseFloat(value) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('tr-TR') : '-';

function IconBadge({ children, bg, color }) {
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        bgcolor: bg,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {children}
    </Box>
  );
}

function InfoRow({ icon, label, value, bg, color }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
      <IconBadge bg={bg} color={color}>{icon}</IconBadge>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: C.muted, display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color: C.black, wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Stack>
  );
}

function StatCard({ title, value, icon, bg, color, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2.5,
        border: `1px solid ${C.border}`,
        bgcolor: C.card,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }
      }}
    >
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconBadge bg={bg} color={color}>{icon}</IconBadge>
          <Box>
            <Typography variant="caption" sx={{ color: C.muted }}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: C.black, lineHeight: 1.2 }}>
              {loading ? '...' : value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const getInstallmentMeta = (installment) => {
  const status = installment.display_status || installment.status;
  const due = new Date(installment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (status === 'paid') {
    return {
      label: 'Ödendi',
      icon: <CheckCircle sx={{ fontSize: 16 }} />,
      sx: { bgcolor: C.greenBg, color: C.green, border: 'none', fontWeight: 600 }
    };
  }
  if (status === 'overdue' || (status === 'unpaid' && due < today)) {
    return {
      label: 'Gecikmiş',
      icon: <ErrorIcon sx={{ fontSize: 16 }} />,
      sx: { bgcolor: C.redBg, color: C.red, border: 'none', fontWeight: 600 }
    };
  }
  return {
    label: 'Bekliyor',
    icon: <Warning sx={{ fontSize: 16 }} />,
    sx: { bgcolor: C.amberBg, color: C.amber, border: 'none', fontWeight: 600 }
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
    const nextDue = pending.map((i) => new Date(i.due_date)).sort((a, b) => a - b)[0];
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

  if (!customer && !loading) return null;

  const tableHeadSx = { bgcolor: '#f9fafb', fontWeight: 700, color: C.black };

  return (
    <Box sx={{ bgcolor: C.pageBg, minHeight: '100vh', pb: 5 }}>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Üst bar — açık yazı garantili */}
      <Box sx={{ bgcolor: C.headerBg, color: C.white, py: 3, px: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box component="img" src="/logo.png" alt="Marka World" sx={{ height: 38, display: { xs: 'none', sm: 'block' } }} />
              <Avatar sx={{ width: 52, height: 52, bgcolor: C.white, color: C.black, fontWeight: 800 }}>
                {customer?.name?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Müşteri Paneli
                </Typography>
                <Typography sx={{ color: C.white, fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {loading ? <Skeleton width={140} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} /> : customer?.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
                  {customer?.email}
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              onClick={handleLogout}
              startIcon={<ExitToApp />}
              sx={{
                color: C.white,
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: C.white, bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Çıkış
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {loading && (
          <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: C.border, '& .MuiLinearProgress-bar': { bgcolor: C.black } }} />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={loadCustomerData}>Yenile</Button>}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <StatCard title="Kredi Limiti" value={formatMoney(stats.creditLimit)} icon={<CreditCard />} bg="#f3f4f6" color={C.black} loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard title="Mevcut Borç" value={formatMoney(stats.currentDebt)} icon={<TrendingDown />} bg={C.redBg} color={C.red} loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard title="Kullanılabilir" value={formatMoney(stats.available)} icon={<AccountBalanceWallet />} bg={C.greenBg} color={C.green} loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard title="Sonraki Taksit" value={stats.nextDue ? formatDate(stats.nextDue) : 'Yok'} icon={<Event />} bg={C.amberBg} color={C.amber} loading={loading} />
          </Grid>
        </Grid>

        <Card elevation={0} sx={{ mb: 3, borderRadius: 2.5, border: `1px solid ${C.border}`, bgcolor: C.card, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography fontWeight={600} sx={{ color: C.black }}>Limit kullanımı</Typography>
            <Typography fontWeight={700} sx={{ color: C.black }}>%{stats.usagePercent.toFixed(0)}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={stats.usagePercent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: stats.usagePercent > 80 ? C.red : C.black
              }
            }}
          />
          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
            <Chip size="small" icon={<CheckCircle />} label={`${stats.paidCount} ödendi`} sx={{ bgcolor: C.greenBg, color: C.green, fontWeight: 600 }} />
            <Chip size="small" icon={<Schedule />} label={`${stats.pendingCount} bekliyor`} sx={{ bgcolor: C.amberBg, color: C.amber, fontWeight: 600 }} />
            {stats.overdueCount > 0 && (
              <Chip size="small" icon={<ErrorIcon />} label={`${stats.overdueCount} gecikmiş`} sx={{ bgcolor: C.redBg, color: C.red, fontWeight: 600 }} />
            )}
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${C.border}`, bgcolor: C.card, mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: C.black, mb: 2 }}>
                  Hesap Bilgileri
                </Typography>
                <InfoRow icon={<Phone fontSize="small" />} label="Telefon" value={customer?.phone} bg="#eff6ff" color="#2563eb" />
                <InfoRow icon={<Email fontSize="small" />} label="E-posta" value={customer?.email} bg="#f3e8ff" color="#7c3aed" />
                <InfoRow icon={<Badge fontSize="small" />} label="T.C. Kimlik No" value={customer?.tc_no} bg="#f3f4f6" color={C.black} />
                <InfoRow icon={<Home fontSize="small" />} label="Adres" value={customer?.address || 'Belirtilmemiş'} bg="#fff7ed" color={C.amber} />
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${C.border}`, bgcolor: C.card }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <IconBadge bg="#f3f4f6" color={C.black}><AccountBalance fontSize="small" /></IconBadge>
                  <Typography variant="h6" fontWeight={700} sx={{ color: C.black }}>Ödeme Bilgileri</Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: C.muted }}>Alıcı</Typography>
                <Stack direction="row" alignItems="flex-start" mb={2}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: C.black, flex: 1, pr: 1 }}>
                    {COMPANY_NAME}
                  </Typography>
                  <IconButton size="small" onClick={() => handleCopy(COMPANY_NAME, 'Firma adı kopyalandı')}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="caption" sx={{ color: C.muted }}>IBAN</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderColor: C.border, bgcolor: '#f9fafb', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <Stack direction="row" alignItems="center">
                    <Box sx={{ flex: 1, color: C.black, wordBreak: 'break-all' }}>{IBAN}</Box>
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
                  sx={{ bgcolor: C.whatsapp, color: C.white, fontWeight: 600, py: 1.2, '&:hover': { bgcolor: '#1da851' } }}
                >
                  Dekont Gönder (WhatsApp)
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${C.border}`, bgcolor: C.card, overflow: 'hidden' }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant={isMobile ? 'fullWidth' : 'standard'}
                sx={{
                  px: 2,
                  borderBottom: `1px solid ${C.border}`,
                  '& .MuiTab-root': { color: C.muted, fontWeight: 600, textTransform: 'none', minHeight: 52 },
                  '& .Mui-selected': { color: `${C.black} !important` },
                  '& .MuiTabs-indicator': { bgcolor: C.black, height: 3 }
                }}
              >
                <Tab label={`Taksitler (${installments.length})`} />
                <Tab label={`Satışlar (${sales.length})`} />
              </Tabs>

              {tab === 0 && (
                <TableContainer>
                  <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeadSx}>#</TableCell>
                        <TableCell sx={tableHeadSx}>Tutar</TableCell>
                        <TableCell sx={tableHeadSx}>Vade</TableCell>
                        <TableCell sx={tableHeadSx}>Durum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {installments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: C.muted }}>
                            Henüz taksit kaydı yok
                          </TableCell>
                        </TableRow>
                      ) : (
                        installments.map((inst) => {
                          const meta = getInstallmentMeta(inst);
                          return (
                            <TableRow key={inst.id} hover sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                              <TableCell sx={{ color: C.black, fontWeight: 600 }}>{inst.installment_number}</TableCell>
                              <TableCell sx={{ color: C.black }}>{formatMoney(inst.amount)}</TableCell>
                              <TableCell sx={{ color: C.muted }}>{formatDate(inst.due_date)}</TableCell>
                              <TableCell>
                                <Chip icon={meta.icon} label={meta.label} size="small" sx={meta.sx} />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tab === 1 && (
                <TableContainer>
                  <Table size={isMobile ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeadSx}>Satış</TableCell>
                        <TableCell sx={tableHeadSx}>Tarih</TableCell>
                        <TableCell sx={tableHeadSx}>Tutar</TableCell>
                        <TableCell sx={tableHeadSx}>Taksit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: C.muted }}>
                            Henüz satış kaydı yok
                          </TableCell>
                        </TableRow>
                      ) : (
                        sales.map((sale) => (
                          <TableRow key={sale.id} hover sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <ShoppingBag sx={{ fontSize: 18, color: C.muted }} />
                                <Typography component="span" fontWeight={600} sx={{ color: C.black }}>#{sale.id}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ color: C.muted }}>{formatDate(sale.created_at)}</TableCell>
                            <TableCell sx={{ color: C.black, fontWeight: 600 }}>{formatMoney(sale.total_with_interest || sale.total_amount)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${sale.paid_installments || 0} / ${sale.total_installments || sale.installment_count}`}
                                sx={{ bgcolor: '#f3f4f6', color: C.black, fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CustomerProfile;
