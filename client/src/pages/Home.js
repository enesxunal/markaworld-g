import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Slide,
  useScrollTrigger,
  Fab,
  Link as MuiLink,
  TextField,
  Divider,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PaymentsIcon from '@mui/icons-material/Payments';
import SecurityIcon from '@mui/icons-material/Security';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MenuIcon from '@mui/icons-material/Menu';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WomanIcon from '@mui/icons-material/Woman';
import ManIcon from '@mui/icons-material/Man';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import { BRAND } from '../styles/brand';
import SeoHead from '../components/SeoHead';
import { SEO_PAGES, buildHomeJsonLd } from '../seo/siteConfig';

const WHATSAPP_URL = 'https://wa.me/905368324660';
const PHONE_DISPLAY = '(0356) 502 78 99';
const PHONE_TEL = 'tel:+903565027899';
const EMAIL = 'info@markaworld.com.tr';
const LOGO_SRC = '/logo.png';

const ACCENT = BRAND.accent;
const ACCENT_DARK = BRAND.accentDark;
const WARM_WHITE = BRAND.warmWhite;
const WARM_GRAY = BRAND.warmGray;
const DARK = BRAND.black;
const DARK_SURFACE = BRAND.dark;

const PAGE_MAX = BRAND.pageMax;

const PageContainer = ({ children, ...props }) => (
  <Container maxWidth={false} sx={{ maxWidth: PAGE_MAX, mx: 'auto', px: { xs: 2.5, sm: 3, md: 5 } }} {...props}>
    {children}
  </Container>
);

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  minHeight: '75vh',
  display: 'flex',
  alignItems: 'center',
  background: DARK,
  color: 'white',
  padding: theme.spacing(10, 0, 8),
  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    padding: theme.spacing(8, 0, 6),
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  zIndex: 1000,
  bgcolor: DARK,
  color: 'white',
  '&:hover': { bgcolor: '#333' },
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const WhatsAppFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  left: theme.spacing(4),
  zIndex: 1000,
  backgroundColor: '#25D366',
  color: 'white',
  '&:hover': { backgroundColor: '#1da851' },
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(2),
    left: theme.spacing(2),
  },
}));

const CategoryCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 16,
  overflow: 'hidden',
  minHeight: 320,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(3),
  border: '1px solid rgba(255,255,255,0.1)',
  transition: 'transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
  cursor: 'default',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: alpha(ACCENT, 0.5),
    boxShadow: `0 20px 40px rgba(0,0,0,0.35)`,
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 360,
    padding: theme.spacing(4),
  },
}));

const ValueCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'white',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
  },
}));

const StepCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2.5),
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'white',
  height: '100%',
}));

const primaryDarkButtonSx = {
  bgcolor: ACCENT,
  color: DARK,
  px: { xs: 3.5, md: 4.5 },
  py: 1.75,
  fontSize: { xs: '0.95rem', md: '1.05rem' },
  fontWeight: 700,
  borderRadius: '8px',
  letterSpacing: '0.02em',
  boxShadow: 'none',
  '&:hover': { bgcolor: ACCENT_DARK, boxShadow: 'none' },
};

const primaryLightButtonSx = {
  bgcolor: 'white',
  color: DARK,
  px: { xs: 3.5, md: 4.5 },
  py: 1.75,
  fontSize: { xs: '0.95rem', md: '1.05rem' },
  fontWeight: 700,
  borderRadius: '8px',
  letterSpacing: '0.02em',
  '&:hover': { bgcolor: WARM_WHITE },
};

const outlineLightButtonSx = {
  color: 'white',
  borderColor: alpha('#fff', 0.45),
  px: { xs: 3.5, md: 4.5 },
  py: 1.75,
  fontSize: { xs: '0.95rem', md: '1.05rem' },
  fontWeight: 600,
  borderRadius: '8px',
  borderWidth: 1.5,
  '&:hover': {
    borderColor: 'white',
    borderWidth: 1.5,
    bgcolor: alpha('#fff', 0.06),
  },
};

const outlineDarkButtonSx = {
  color: DARK,
  borderColor: alpha(DARK, 0.25),
  px: { xs: 3.5, md: 4 },
  py: 1.5,
  fontSize: { xs: '0.95rem', md: '1rem' },
  fontWeight: 600,
  borderRadius: '8px',
  borderWidth: 1.5,
  '&:hover': {
    borderColor: DARK,
    borderWidth: 1.5,
    bgcolor: alpha(DARK, 0.04),
  },
};

function ScrollTop({ children }) {
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 100 });
  return (
    <Slide direction="up" in={trigger}>
      <Box
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Slide>
  );
}

const NAV_ITEMS = [
  { label: 'Ürünler', id: 'products' },
  { label: 'Taksitli Alışveriş', id: 'installments' },
  { label: 'Nasıl Çalışır', id: 'how-it-works' },
  { label: 'Blog', to: '/blog' },
  { label: 'İletişim', id: 'contact' },
];

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const navScrolled = useScrollTrigger({ disableHysteresis: true, threshold: 20 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const homeSeo = SEO_PAGES.home;
  const homeJsonLd = buildHomeJsonLd();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    handleClose();
  };

  const categories = [
    { icon: <WomanIcon />, title: 'Kadın', description: 'Günlük ve özel gün koleksiyonları' },
    { icon: <ManIcon />, title: 'Erkek', description: 'Şık ve rahat parçalar' },
    { icon: <ChildCareIcon />, title: 'Çocuk', description: 'Konforlu ve dayanıklı ürünler' },
  ];

  const valueProps = [
    {
      icon: <StorefrontIcon sx={{ fontSize: 40 }} />,
      title: 'Yerinde Hizmet',
      description: 'Tokat Karşıyaka mağazamızda ürünleri yerinde görün ve deneyin.',
    },
    {
      icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
      title: 'Esnek Ödeme Planı',
      description: 'Size uygun taksit planı; koşullar başvuru sonrası netleşir.',
    },
    {
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />,
      title: 'Limit ve Ödeme Takibi',
      description: 'Müşteri panelinden limit, borç ve ödemelerinizi takip edin.',
    },
  ];

  const installmentSteps = [
    { step: '01', title: 'Başvuru', description: 'Üyelik formunu doldurun, ekibimiz değerlendirir.' },
    { step: '02', title: 'Mağazada Seçim', description: 'Beğendiğiniz ürünleri danışmanlarımızla seçin.' },
    { step: '03', title: 'Plan ve Takip', description: 'Ödeme planınız oluşur; panelden takip edin.' },
  ];

  const howItWorks = [
    {
      num: '01',
      icon: <PersonAddIcon sx={{ fontSize: 28 }} />,
      title: 'Başvuru Yapın',
      description: 'Üyelik formunu doldurun; ekibimiz başvurunuzu değerlendirir.',
    },
    {
      num: '02',
      icon: <LocalOfferIcon sx={{ fontSize: 28 }} />,
      title: 'Mağazadan Seçin',
      description: 'Mağazamızdan ürünleri danışmanlarımızla birlikte seçin.',
    },
    {
      num: '03',
      icon: <PaymentsIcon sx={{ fontSize: 28 }} />,
      title: 'Taksit Planı',
      description: 'Size uygun ödeme planı oluşturulur; detaylar sözleşmede yer alır.',
    },
    {
      num: '04',
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      title: 'Takip ve Destek',
      description: 'Ödemelerinizi panelden takip edin; sorularınız için bize ulaşın.',
    },
  ];

  const trustItems = [
    {
      icon: <StorefrontIcon sx={{ fontSize: 32 }} />,
      title: 'Yerinde Mağaza Hizmeti',
      description: 'Tokat\'ta fiziksel mağaza; yüz yüze danışmanlık.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 32 }} />,
      title: 'Şeffaf Süreç',
      description: 'Limit, taksit ve ödeme bilgileri panelde görünür.',
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 32 }} />,
      title: 'Hızlı İletişim',
      description: 'Telefon ve WhatsApp üzerinden kolayca ulaşın.',
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 32 }} />,
      title: 'Satış Sonrası Takip',
      description: 'Ödeme hatırlatmaları ve hesap yönetimi tek sistemde.',
    },
  ];

  const heroTrust = [
    'Tokat\'ta Fiziksel Mağaza',
    'Esnek Taksit Planı',
    'Müşteri Paneli Takibi',
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('E-posta adresinizi girin');
      setMessageType('error');
      return;
    }
    try {
      await emailAPI.subscribe(email);
      setMessage('Bülten listemize kaydoldunuz.');
      setMessageType('success');
      setEmail('');
    } catch (error) {
      setMessage('Kayıt başarısız. Lütfen tekrar deneyin.');
      setMessageType('error');
    }
  };

  const renderNavLinks = (asMenu = false) =>
    NAV_ITEMS.map((item) => {
      const key = item.to || item.id;
      const handleClick = () => {
        if (item.to) {
          navigate(item.to);
          handleClose();
          return;
        }
        scrollToSection(item.id);
      };

      return asMenu ? (
        <MenuItem
          key={key}
          onClick={handleClick}
          sx={{ py: 2, fontSize: '1.05rem', fontWeight: 500 }}
        >
          {item.label}
        </MenuItem>
      ) : (
        <Button
          key={key}
          color="inherit"
          onClick={handleClick}
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            letterSpacing: '0.02em',
            px: 1.5,
            '&:hover': { color: ACCENT },
          }}
        >
          {item.label}
        </Button>
      );
    });

  return (
    <Box sx={{ bgcolor: 'white' }} component="div">
      <SeoHead
        title={homeSeo.title}
        description={homeSeo.description}
        canonicalPath={homeSeo.path}
        robots={homeSeo.robots}
        jsonLd={homeJsonLd}
      />
      <AppBar
        position="fixed"
        component="header"
        elevation={0}
        sx={{
          bgcolor: navScrolled ? alpha(DARK, 0.92) : alpha(DARK, 0.85),
          backdropFilter: navScrolled ? 'blur(12px)' : 'blur(8px)',
          borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      >
        <Toolbar
          component="nav"
          aria-label="Ana menü"
          sx={{
            justifyContent: 'space-between',
            minHeight: { xs: 64, md: 80 },
            px: { xs: 2, md: 4 },
            maxWidth: PAGE_MAX,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            aria-label="Marka World anasayfa"
            sx={{ display: 'inline-flex', lineHeight: 0 }}
          >
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Marka World"
              width={180}
              height={31}
              sx={{
                height: { xs: 38, md: 48 },
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </Box>

          {isMobile ? (
            <>
              <IconButton edge="end" color="inherit" onClick={handleMenu} aria-label="Menüyü aç" size="large">
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    width: '100vw',
                    maxWidth: '100vw',
                    left: '0 !important',
                    right: 0,
                    borderRadius: 0,
                    mt: 0.5,
                    bgcolor: DARK,
                    color: 'white',
                  },
                }}
              >
                {renderNavLinks(true)}
                <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
                <MenuItem
                  onClick={() => { navigate('/customer-login'); handleClose(); }}
                  sx={{ py: 2.5, fontWeight: 600, color: ACCENT }}
                >
                  Müşteri Girişi
                </MenuItem>
                <MenuItem
                  component="a"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ py: 2.5, color: '#25D366' }}
                >
                  <WhatsAppIcon sx={{ mr: 1.5 }} /> WhatsApp
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {renderNavLinks(false)}
              </Stack>
              <Button variant="contained" onClick={() => navigate('/customer-login')} sx={primaryLightButtonSx}>
                Müşteri Girişi
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar sx={{ minHeight: { xs: 64, md: 80 } }} />

      <Box component="main">
      {/* HERO */}
      <HeroSection component="section" aria-label="Giriş">
        <PageContainer sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 5, md: 4 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                sx={{
                  color: ACCENT,
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  mb: 3,
                }}
              >
                Tokat&apos;ta Mağazadan Taksitli Alışveriş
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  fontSize: { xs: '2.4rem', sm: '3rem', md: '4rem', lg: '4.5rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  mb: 3,
                }}
              >
                Tarzını Bugün Seç,
                <br />
                Ödemeni Planına Yay
              </Typography>
              <Typography
                component="p"
                sx={{
                  color: alpha('#fff', 0.7),
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.7,
                  maxWidth: 520,
                  mb: 4,
                }}
              >
                Marka ürünlerini mağazamızdan incele, sana uygun taksit seçenekleri hakkında satış
                danışmanımızdan bilgi al.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => scrollToSection('products')}
                  endIcon={<ArrowForwardIcon />}
                  sx={primaryDarkButtonSx}
                >
                  Mağazayı Keşfet
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollToSection('installments')}
                  sx={outlineLightButtonSx}
                >
                  Taksitli Alışverişi İncele
                </Button>
              </Stack>
              <Button
                component="a"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
                sx={{
                  color: alpha('#fff', 0.55),
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  '&:hover': { color: '#25D366', bgcolor: 'transparent' },
                }}
              >
                WhatsApp&apos;tan Bilgi Al
              </Button>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 3 }}
                sx={{ mt: 5, pt: 4, borderTop: `1px solid ${alpha('#fff', 0.1)}` }}
              >
                {heroTrust.map((item) => (
                  <Stack key={item} direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ fontSize: 18, color: ACCENT }} />
                    <Typography sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' }, color: alpha('#fff', 0.65) }}>
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha('#fff', 0.12)}`,
                  bgcolor: DARK_SURFACE,
                  p: { xs: 3, md: 4 },
                  borderLeft: `3px solid ${ACCENT}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: ACCENT,
                    mb: 3,
                  }}
                >
                  Mağaza Koleksiyonları
                </Typography>
                <Stack spacing={0} divider={<Divider sx={{ borderColor: alpha('#fff', 0.08) }} />}>
                  {categories.map((cat) => (
                    <Stack
                      key={cat.title}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ py: 2.5 }}
                    >
                      <Box sx={{ color: alpha('#fff', 0.5), '& svg': { fontSize: 28 } }}>{cat.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'white', mb: 0.5 }}>
                          {cat.title}
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: alpha('#fff', 0.55), lineHeight: 1.5 }}>
                          {cat.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
                <Typography sx={{ mt: 3, fontSize: '0.8rem', color: alpha('#fff', 0.4) }}>
                  Tokat Karşıyaka · Mağazada incele
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </PageContainer>
      </HeroSection>

      {/* NEDEN MARKA WORLD */}
      <Box component="section" aria-labelledby="value-heading" sx={{ py: { xs: 8, md: 12 }, bgcolor: WARM_WHITE }}>
        <PageContainer>
          <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography
                id="value-heading"
                component="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: DARK,
                }}
              >
                Neden
                <br />
                Marka World?
              </Typography>
              <Typography sx={{ mt: 2, color: WARM_GRAY, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7, maxWidth: 360 }}>
                Tokat&apos;ta marka alışverişini mağaza deneyimi, esnek ödeme ve dijital takiple bir araya getiriyoruz.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                {valueProps.map((item) => (
                  <Grid item xs={12} sm={4} key={item.title}>
                    <ValueCard>
                      <Box sx={{ color: ACCENT_DARK, mb: 2.5 }}>{item.icon}</Box>
                      <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', md: '1.25rem' }, mb: 1.5, color: DARK }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: WARM_GRAY, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.65 }}>
                        {item.description}
                      </Typography>
                    </ValueCard>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* KATEGORİLER */}
      <Box
        id="products"
        component="section"
        aria-labelledby="products-heading"
        sx={{ bgcolor: DARK, py: { xs: 8, md: 12 }, scrollMarginTop: '80px' }}
      >
        <PageContainer>
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            <Typography
              id="products-heading"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.75rem' },
                color: 'white',
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Ürün Kategorileri
            </Typography>
            <Typography sx={{ color: alpha('#fff', 0.55), fontSize: { xs: '1rem', md: '1.1rem' }, maxWidth: 560, lineHeight: 1.7 }}>
              Ürünler mağazamızda satışa sunulur. Online sepet veya kargo süreci bulunmaz.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={12} md={4} key={category.title}>
                <CategoryCard sx={{ bgcolor: DARK_SURFACE }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 24,
                      right: 24,
                      color: alpha('#fff', 0.15),
                      '& svg': { fontSize: { xs: 64, md: 80 } },
                    }}
                  >
                    {category.icon}
                  </Box>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        color: 'white',
                        letterSpacing: '-0.02em',
                        mb: 1,
                      }}
                    >
                      {category.title}
                    </Typography>
                    <Typography sx={{ color: alpha('#fff', 0.6), fontSize: { xs: '0.95rem', md: '1.05rem' }, mb: 2.5, lineHeight: 1.6 }}>
                      {category.description}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: ACCENT,
                      }}
                    >
                      Mağazada İncele
                    </Typography>
                  </Box>
                </CategoryCard>
              </Grid>
            ))}
          </Grid>
        </PageContainer>
      </Box>

      {/* TAKSİTLİ ALIŞVERİŞ */}
      <Box
        id="installments"
        component="section"
        aria-labelledby="installments-heading"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white', scrollMarginTop: '80px' }}
      >
        <PageContainer>
          <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                id="installments-heading"
                component="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: DARK,
                  mb: 3,
                }}
              >
                Taksitli Alışveriş Nasıl İşler?
              </Typography>
              <Typography sx={{ color: WARM_GRAY, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.75, mb: 2 }}>
                Marka World klasik bir online mağaza değildir. Müşterilerimiz mağazamızdan ürün seçer; limit ve
                taksit koşulları başvuru ve değerlendirme sonrasında belirlenir.
              </Typography>
              <Typography sx={{ color: WARM_GRAY, fontSize: { xs: '0.9rem', md: '0.95rem' }, lineHeight: 1.7, mb: 4, fontStyle: 'italic' }}>
                Koşullar değerlendirmeye göre belirlenir.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ ...primaryDarkButtonSx, bgcolor: DARK, color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', '&:hover': { bgcolor: '#333' } }}
                >
                  Üyelik Başvurusu
                </Button>
                <Button
                  component="a"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  sx={outlineDarkButtonSx}
                >
                  Bilgi Al
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                {installmentSteps.map((item, index) => (
                  <Box
                    key={item.step}
                    sx={{
                      display: 'flex',
                      gap: 3,
                      p: { xs: 3, md: 3.5 },
                      borderRadius: 2,
                      bgcolor: WARM_WHITE,
                      border: '1px solid rgba(0,0,0,0.06)',
                      alignItems: 'flex-start',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontWeight: 800,
                        color: alpha(ACCENT_DARK, 0.5),
                        lineHeight: 1,
                        minWidth: 48,
                      }}
                    >
                      {item.step}
                    </Typography>
                    <Box>
                      <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.2rem' }, color: DARK, mb: 0.75 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: WARM_GRAY, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.65 }}>
                        {item.description}
                      </Typography>
                    </Box>
                    {index < installmentSteps.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: { xs: 40, md: 48 },
                          bottom: -16,
                          width: 2,
                          height: 16,
                          bgcolor: alpha(ACCENT, 0.4),
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* NASIL ÇALIŞIR */}
      <Box
        id="how-it-works"
        component="section"
        aria-labelledby="how-heading"
        sx={{ py: { xs: 8, md: 12 }, scrollMarginTop: '80px', bgcolor: WARM_WHITE }}
      >
        <PageContainer>
          <Typography
            id="how-heading"
            component="h2"
            align="center"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.02em',
              color: DARK,
              mb: { xs: 5, md: 7 },
            }}
          >
            Nasıl Çalışır?
          </Typography>

          <Box sx={{ position: 'relative' }}>
            {!isMobile && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 36,
                  left: '10%',
                  right: '10%',
                  height: 2,
                  bgcolor: alpha(ACCENT, 0.3),
                  zIndex: 0,
                }}
              />
            )}
            <Grid container spacing={3}>
              {howItWorks.map((step) => (
                <Grid item xs={12} sm={6} md={3} key={step.num}>
                  <StepCard sx={{ textAlign: { xs: 'left', md: 'center' }, position: 'relative', zIndex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3rem' },
                        fontWeight: 800,
                        color: alpha(ACCENT_DARK, 0.45),
                        lineHeight: 1,
                        mb: 2,
                      }}
                    >
                      {step.num}
                    </Typography>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(ACCENT, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: ACCENT_DARK,
                        mx: { xs: 0, md: 'auto' },
                        mb: 2,
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.15rem' }, color: DARK, mb: 1 }}>
                      {step.title}
                    </Typography>
                    <Typography sx={{ color: WARM_GRAY, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.65 }}>
                      {step.description}
                    </Typography>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </PageContainer>
      </Box>

      {/* GÜVEN */}
      <Box
        id="trust"
        component="section"
        aria-labelledby="trust-heading"
        sx={{ bgcolor: DARK, py: { xs: 8, md: 12 }, scrollMarginTop: '80px' }}
      >
        <PageContainer>
          <Grid container spacing={{ xs: 5, md: 6 }}>
            <Grid item xs={12} md={4}>
              <Typography
                id="trust-heading"
                component="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Güven Unsurları
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.55), fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7, maxWidth: 360 }}>
                Tokat&apos;ta yüz yüze hizmet, şeffaf süreç ve sürekli destek ile alışverişinizi güvenle yönetin.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={0}>
                {trustItems.map((item, index) => (
                  <Grid item xs={12} sm={6} key={item.title}>
                    <Box
                      sx={{
                        p: { xs: 3, md: 4 },
                        borderTop: index < 2 ? `1px solid ${alpha('#fff', 0.08)}` : 'none',
                        borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
                        borderRight: { sm: index % 2 === 0 ? `1px solid ${alpha('#fff', 0.08)}` : 'none' },
                        height: '100%',
                      }}
                    >
                      <Box sx={{ color: ACCENT, mb: 2 }}>{item.icon}</Box>
                      <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.2rem' }, color: 'white', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: alpha('#fff', 0.55), fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.65 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* CTA BAND */}
      <Box
        component="section"
        aria-label="Hızlı iletişim"
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: WARM_WHITE,
          borderTop: `1px solid ${BRAND.border}`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <PageContainer>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography component="h2" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' }, color: DARK, letterSpacing: '-0.02em' }}>
                Sorularınız mı var?
              </Typography>
              <Typography sx={{ mt: 1.5, color: WARM_GRAY, fontSize: { xs: '1rem', md: '1.05rem' } }}>
                Satış danışmanlarımız size yardımcı olmaya hazır.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ md: 'flex-end' }}>
                <Button
                  component="a"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  size="large"
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    bgcolor: '#25D366',
                    borderRadius: '8px',
                    px: 4,
                    py: 1.75,
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#1da851' },
                  }}
                >
                  WhatsApp&apos;tan Yaz
                </Button>
                <Button
                  component="a"
                  href={PHONE_TEL}
                  variant="outlined"
                  size="large"
                  startIcon={<PhoneIcon />}
                  sx={{ ...outlineDarkButtonSx, py: 1.75 }}
                >
                  {PHONE_DISPLAY}
                </Button>
                <Button
                  variant="text"
                  size="large"
                  onClick={() => navigate('/customer-login')}
                  sx={{ color: DARK, fontWeight: 600, fontSize: '1rem', '&:hover': { bgcolor: alpha(DARK, 0.04) } }}
                >
                  Müşteri Girişi →
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* MAĞAZA VE İLETİŞİM */}
      <Box
        id="contact"
        component="section"
        aria-labelledby="contact-heading"
        sx={{ scrollMarginTop: '80px', bgcolor: 'white', py: { xs: 8, md: 12 } }}
      >
        <PageContainer>
          <Typography
            id="contact-heading"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.02em',
              color: DARK,
              mb: { xs: 5, md: 7 },
            }}
          >
            Mağaza ve İletişim
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: { xs: 4, md: 5 },
                  borderRadius: 3,
                  bgcolor: DARK,
                  color: 'white',
                  height: '100%',
                  border: `1px solid ${alpha('#fff', 0.06)}`,
                }}
              >
                <Typography component="h3" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.4rem' }, mb: 4 }}>
                  İletişim Bilgileri
                </Typography>
                <Stack spacing={3.5}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                    <LocationOnIcon sx={{ color: ACCENT, mt: 0.3, fontSize: 24 }} aria-hidden="true" />
                    <Box>
                      <Typography sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.6 }}>
                        Karşıyaka, Vali Ayhan Çevik Cd. 46/A
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.6 }}>
                        60000 Tokat Merkez/Tokat
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <PhoneIcon sx={{ color: ACCENT, fontSize: 24 }} aria-hidden="true" />
                    <MuiLink
                      href={PHONE_TEL}
                      sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '1rem', md: '1.05rem' }, textDecoration: 'none', '&:hover': { color: ACCENT } }}
                    >
                      {PHONE_DISPLAY}
                    </MuiLink>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <MailOutlineIcon sx={{ color: ACCENT, fontSize: 24 }} aria-hidden="true" />
                    <MuiLink
                      href={`mailto:${EMAIL}`}
                      sx={{ color: 'white', fontSize: { xs: '1rem', md: '1.05rem' }, textDecoration: 'none', '&:hover': { color: ACCENT } }}
                    >
                      {EMAIL}
                    </MuiLink>
                  </Box>
                </Stack>

                <Button
                  component="a"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  fullWidth
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    mt: 4,
                    bgcolor: '#25D366',
                    borderRadius: '8px',
                    py: 1.75,
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#1da851' },
                  }}
                >
                  WhatsApp&apos;tan Yaz
                </Button>

                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: alpha('#fff', 0.4), mb: 2 }}>
                    Sosyal Medya
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <IconButton
                      href="https://www.instagram.com/markaworldtokat"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      sx={{ bgcolor: alpha('#fff', 0.08), color: '#fff', border: `1px solid ${alpha('#fff', 0.12)}`, '&:hover': { bgcolor: alpha('#fff', 0.15) } }}
                    >
                      <InstagramIcon />
                    </IconButton>
                    <IconButton
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      sx={{ bgcolor: alpha('#fff', 0.08), color: '#fff', border: `1px solid ${alpha('#fff', 0.12)}`, '&:hover': { bgcolor: alpha('#fff', 0.15) } }}
                    >
                      <WhatsAppIcon />
                    </IconButton>
                    <IconButton
                      href="https://g.co/kgs/mLGTxNA"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Google Haritalar"
                      sx={{ bgcolor: alpha('#fff', 0.08), color: '#fff', border: `1px solid ${alpha('#fff', 0.12)}`, '&:hover': { bgcolor: alpha('#fff', 0.15) } }}
                    >
                      <LocationOnIcon />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: { xs: 320, md: 480 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                }}
              >
                <iframe
                  title="Marka World Tokat mağaza konumu"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3040.8700041204434!2d36.538942076860806!3d40.34522967145135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x407dbbbaf9bc68a9%3A0x65ebef1ec2f5d8e6!2sMarka%20World%20Tokat!5e0!3m2!1str!2str!4v1750463255138!5m2!1str!2str"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 320, display: 'block' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Box>
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      {/* BÜLTEN */}
      <Box component="section" aria-labelledby="newsletter-heading" sx={{ py: { xs: 6, md: 8 }, bgcolor: WARM_WHITE }}>
        <PageContainer>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                id="newsletter-heading"
                component="h2"
                sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.75rem' }, color: DARK, letterSpacing: '-0.02em' }}
              >
                Bültenimize Abone Olun
              </Typography>
              <Typography sx={{ mt: 1.5, color: WARM_GRAY, fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.65 }}>
                Yeni ürün ve duyurulardan haberdar olun.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box
                component="form"
                onSubmit={handleSubscribe}
                sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}
              >
                <TextField
                  placeholder="E-posta adresiniz"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      bgcolor: 'white',
                      fontSize: '1rem',
                      '& fieldset': { borderColor: alpha(DARK, 0.15) },
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: DARK,
                    borderRadius: '8px',
                    px: 5,
                    py: 1.75,
                    fontWeight: 700,
                    fontSize: '1rem',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#333' },
                  }}
                >
                  Abone Ol
                </Button>
              </Box>
              {message && (
                <Typography
                  variant="body2"
                  role="status"
                  sx={{ mt: 2, color: messageType === 'success' ? 'success.main' : 'error.main' }}
                >
                  {message}
                </Typography>
              )}
            </Grid>
          </Grid>
        </PageContainer>
      </Box>

      </Box>{/* /main */}

      {/* FOOTER */}
      <Box component="footer" sx={{ bgcolor: DARK, color: 'white', py: { xs: 8, md: 10 } }}>
        <PageContainer>
          <Grid container spacing={{ xs: 5, md: 6 }}>
            <Grid item xs={12} md={4}>
              <Box
                component="img"
                src={LOGO_SRC}
                alt="Marka World"
                width={180}
                height={31}
                sx={{ height: { xs: 44, md: 52 }, width: 'auto', mb: 3, filter: 'brightness(0) invert(1)' }}
              />
              <Typography sx={{ color: alpha('#fff', 0.5), fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.7, mb: 3, maxWidth: 320 }}>
                Tokat&apos;ta taksitli marka alışverişi ve müşteri takip sistemi.
              </Typography>
              <Stack spacing={0.75} sx={{ color: alpha('#fff', 0.45), fontSize: '0.9rem' }}>
                <Typography>Karşıyaka, Vali Ayhan Çevik Cd. 46/A</Typography>
                <Typography>60000 Tokat Merkez/Tokat</Typography>
                <MuiLink href={PHONE_TEL} sx={{ color: alpha('#fff', 0.45), textDecoration: 'none', '&:hover': { color: ACCENT } }}>
                  {PHONE_DISPLAY}
                </MuiLink>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: alpha('#fff', 0.4), mb: 3 }}>
                Bağlantılar
              </Typography>
              <Stack spacing={2}>
                {NAV_ITEMS.map((item) =>
                  item.to ? (
                    <MuiLink
                      key={item.to}
                      component={RouterLink}
                      to={item.to}
                      sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}
                    >
                      {item.label}
                    </MuiLink>
                  ) : (
                    <MuiLink
                      key={item.id}
                      component="button"
                      onClick={() => scrollToSection(item.id)}
                      sx={{ color: alpha('#fff', 0.6), textAlign: 'left', fontSize: '0.95rem', '&:hover': { color: ACCENT } }}
                    >
                      {item.label}
                    </MuiLink>
                  )
                )}
                <MuiLink component={RouterLink} to="/register" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  Üyelik Başvurusu
                </MuiLink>
                <MuiLink component={RouterLink} to="/customer-login" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  Müşteri Girişi
                </MuiLink>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: alpha('#fff', 0.4), mb: 3 }}>
                İletişim
              </Typography>
              <Stack spacing={2}>
                <MuiLink href={PHONE_TEL} sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  {PHONE_DISPLAY}
                </MuiLink>
                <MuiLink href={`mailto:${EMAIL}`} sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  {EMAIL}
                </MuiLink>
                <MuiLink href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: '#25D366' } }}>
                  WhatsApp
                </MuiLink>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: alpha('#fff', 0.4), mb: 3 }}>
                Yasal
              </Typography>
              <Stack spacing={2}>
                <MuiLink component={RouterLink} to="/privacy-policy" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  Gizlilik Politikası
                </MuiLink>
                <MuiLink component={RouterLink} to="/terms" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  Kullanım Koşulları
                </MuiLink>
                <MuiLink component={RouterLink} to="/kvkk" sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', '&:hover': { color: ACCENT } }}>
                  KVKK Aydınlatma Metni
                </MuiLink>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ mt: { xs: 6, md: 8 }, pt: 4, borderTop: `1px solid ${alpha('#fff', 0.08)}` }}>
            <Typography sx={{ color: alpha('#fff', 0.35), fontSize: '0.85rem', textAlign: 'center' }}>
              © 2025 Marka World. | Tasarım{' '}
              <MuiLink
                href="https://3kareajans.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: alpha('#fff', 0.35), textDecoration: 'none', '&:hover': { color: ACCENT } }}
              >
                3 Kare Ajans
              </MuiLink>
            </Typography>
          </Box>
        </PageContainer>
      </Box>

      <WhatsAppFab
        component="a"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ile iletişime geç"
        size="medium"
      >
        <WhatsAppIcon />
      </WhatsAppFab>

      <ScrollTop>
        <StyledFab size="small" aria-label="Sayfa başına dön">
          <KeyboardArrowUpIcon />
        </StyledFab>
      </ScrollTop>
    </Box>
  );
};

export default Home;
