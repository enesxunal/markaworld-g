import React, { useState, useEffect, useMemo } from 'react';
import {
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
  IconButton,
  Stack,
  Snackbar,
  LinearProgress,
  Skeleton,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
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
  Event,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { customerAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import {
  BRAND,
  statCardSx,
  pageCardSx,
  chipPaidSx,
  chipPendingSx,
  chipOverdueSx,
  chipNeutralSx,
} from '../styles/brand';

const IBAN = 'TR48 0011 1000 0000 0137 1441 61';
const COMPANY_NAME = '3 Kare Yazılım ve Tasarım Ajansı Limited Şirketi';
const WHATSAPP = '905368324660';

const formatMoney = (value) =>
  (parseFloat(value) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const formatDate = (date) => (date ? new Date(date).toLocaleDateString('tr-TR') : '-');

function IconBadge({ children }) {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1.5,
        bgcolor: BRAND.warmWhite,
        color: BRAND.black,
        border: `1px solid ${BRAND.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
      <IconBadge>{icon}</IconBadge>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: BRAND.warmGray, display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color: BRAND.black, wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Stack>
  );
}

function StatCard({ title, value, icon, loading }) {
  return (
    <Card elevation={0} sx={statCardSx}>
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconBadge>{icon}</IconBadge>
          <Box>
            <Typography variant="caption" sx={{ color: BRAND.warmGray }}>{title}</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.black, lineHeight: 1.2 }}>
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
    return { label: 'Ödendi', icon: <CheckCircle sx={{ fontSize: 16 }} />, sx: chipPaidSx };
  }
  if (status === 'overdue' || (status === 'unpaid' && due < today)) {
    return { label: 'Gecikmiş', icon: <ErrorIcon sx={{ fontSize: 16 }} />, sx: chipOverdueSx };
  }
  return { label: 'Bekliyor', icon: <Warning sx={{ fontSize: 16 }} />, sx: chipPendingSx };
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
      navigate('/customer-login', { state: { message: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.' } });
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
        customerAPI.getMyInstallments(),
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
      usagePercent: creditLimit > 0 ? Math.min((currentDebt / creditLimit) * 100, 100) : 0,
    };
  }, [installments, customer]);

  const handleCopy = (text, message) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  if (!customer && !loading) return null;

  return (
    <Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <PageHeader
        title={loading ? 'Yükleniyor...' : customer?.name}
        subtitle={customer?.email}
      />

      {loading && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: BRAND.border, '& .MuiLinearProgress-bar': { bgcolor: BRAND.black } }} />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={loadCustomerData}>Yenile</Button>}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard title="Kredi Limiti" value={formatMoney(stats.creditLimit)} icon={<CreditCard fontSize="small" />} loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Mevcut Borç" value={formatMoney(stats.currentDebt)} icon={<TrendingDown fontSize="small" />} loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Kullanılabilir" value={formatMoney(stats.available)} icon={<AccountBalanceWallet fontSize="small" />} loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Sonraki Taksit" value={stats.nextDue ? formatDate(stats.nextDue) : 'Yok'} icon={<Event fontSize="small" />} loading={loading} />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ ...pageCardSx, mb: 3, p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography fontWeight={600} sx={{ color: BRAND.black }}>Limit kullanımı</Typography>
          <Typography fontWeight={700} sx={{ color: BRAND.black }}>%{stats.usagePercent.toFixed(0)}</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={stats.usagePercent}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: BRAND.border,
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: stats.usagePercent > 80 ? BRAND.error : BRAND.black,
            },
          }}
        />
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          <Chip size="small" icon={<CheckCircle />} label={`${stats.paidCount} ödendi`} sx={chipPaidSx} />
          <Chip size="small" icon={<Schedule />} label={`${stats.pendingCount} bekliyor`} sx={chipPendingSx} />
          {stats.overdueCount > 0 && (
            <Chip size="small" icon={<ErrorIcon />} label={`${stats.overdueCount} gecikmiş`} sx={chipOverdueSx} />
          )}
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ ...pageCardSx, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.black, mb: 2 }}>Hesap Bilgileri</Typography>
              <InfoRow icon={<Phone fontSize="small" />} label="Telefon" value={customer?.phone} />
              <InfoRow icon={<Email fontSize="small" />} label="E-posta" value={customer?.email} />
              <InfoRow icon={<Badge fontSize="small" />} label="T.C. Kimlik No" value={customer?.tc_no} />
              <InfoRow icon={<Home fontSize="small" />} label="Adres" value={customer?.address || 'Belirtilmemiş'} />
            </CardContent>
          </Card>

          <Card elevation={0} sx={pageCardSx}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <IconBadge><AccountBalance fontSize="small" /></IconBadge>
                <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.black }}>Ödeme Bilgileri</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: BRAND.warmGray }}>Alıcı</Typography>
              <Stack direction="row" alignItems="flex-start" mb={2}>
                <Typography variant="body2" fontWeight={600} sx={{ color: BRAND.black, flex: 1, pr: 1 }}>
                  {COMPANY_NAME}
                </Typography>
                <IconButton size="small" onClick={() => handleCopy(COMPANY_NAME, 'Firma adı kopyalandı')}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="caption" sx={{ color: BRAND.warmGray }}>IBAN</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderColor: BRAND.border, bgcolor: BRAND.warmWhite, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <Stack direction="row" alignItems="center">
                  <Box sx={{ flex: 1, color: BRAND.black, wordBreak: 'break-all' }}>{IBAN}</Box>
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
                sx={{ bgcolor: BRAND.whatsapp, color: BRAND.white, fontWeight: 600, py: 1.2, '&:hover': { bgcolor: '#1da851' } }}
              >
                Dekont Gönder (WhatsApp)
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ ...pageCardSx, overflow: 'hidden' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{ px: 2, borderBottom: `1px solid ${BRAND.border}` }}
            >
              <Tab label={`Taksitler (${installments.length})`} />
              <Tab label={`Satışlar (${sales.length})`} />
            </Tabs>

            {tab === 0 && (
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
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: BRAND.warmGray }}>
                          Henüz taksit kaydı yok
                        </TableCell>
                      </TableRow>
                    ) : (
                      installments.map((inst) => {
                        const meta = getInstallmentMeta(inst);
                        return (
                          <TableRow key={inst.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{inst.installment_number}</TableCell>
                            <TableCell>{formatMoney(inst.amount)}</TableCell>
                            <TableCell sx={{ color: BRAND.warmGray }}>{formatDate(inst.due_date)}</TableCell>
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
                      <TableCell>Satış</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>Taksit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: BRAND.warmGray }}>
                          Henüz satış kaydı yok
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <ShoppingBag sx={{ fontSize: 18, color: BRAND.warmGray }} />
                              <Typography component="span" fontWeight={600}>#{sale.id}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ color: BRAND.warmGray }}>{formatDate(sale.created_at)}</TableCell>
                          <TableCell fontWeight={600}>{formatMoney(sale.total_with_interest || sale.total_amount)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={`${sale.paid_installments || 0} / ${sale.total_installments || sale.installment_count}`}
                              sx={chipNeutralSx}
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
    </Box>
  );
};

export default CustomerProfile;
