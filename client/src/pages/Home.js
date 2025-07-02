import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Paper,
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
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import SecurityIcon from '@mui/icons-material/Security';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MenuIcon from '@mui/icons-material/Menu';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Link, useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WomanIcon from '@mui/icons-material/Woman';
import ManIcon from '@mui/icons-material/Man';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import { Link as RouterLink } from 'react-router-dom';
import { emailAPI } from '../services/api';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Özel stil bileşenleri
const HeroSection = styled(Box)(({ theme }) => ({
  background: '#000000',
  color: 'white',
  padding: theme.spacing(20, 2),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(10, 2),
  },
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: theme.palette.grey[900],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease-in-out',
  '& svg': {
    color: 'white',
    fontSize: '2rem',
  },
  '&:hover': {
    transform: 'scale(1.1)',
    background: theme.palette.grey[800],
  },
  [theme.breakpoints.down('sm')]: {
    width: 60,
    height: 60,
    '& svg': {
      fontSize: '1.5rem',
    },
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  zIndex: 1000,
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const Footer = styled(Box)(({ theme }) => ({
  background: theme.palette.grey[900],
  color: 'white',
  padding: theme.spacing(8, 0),
  marginTop: theme.spacing(8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 0),
    marginTop: theme.spacing(4),
  },
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 4),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(0, 6),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0, 2),
  },
}));

const MenuContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(2),
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: 'white',
  borderColor: 'white',
  '&:hover': {
    borderColor: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const CategoryBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-5px)',
  },
  '& svg': {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    color: 'white',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    '& svg': {
      fontSize: 36,
      marginBottom: theme.spacing(1),
    },
  },
}));

const NewsletterBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  padding: theme.spacing(8, 0),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 0),
  },
}));

const NeonLogo = styled('img')(({ theme }) => ({
  maxWidth: '85%',
  width: 'auto',
  height: 'auto',
  maxHeight: '450px',
  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))',
  animation: 'neonPulse 2s infinite',
  '@keyframes neonPulse': {
    '0%': {
      filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))',
    },
    '50%': {
      filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4))',
      transform: 'scale(1.02)',
    },
    '100%': {
      filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))',
    },
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '95%',
    maxHeight: '300px',
  },
}));

function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Slide direction="up" in={trigger}>
      <Box onClick={handleClick} role="presentation" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        {children}
      </Box>
    </Slide>
  );
}

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    handleClose();
  };

  const categories = [
    {
      icon: <WomanIcon sx={{ fontSize: 28 }} />,
      title: 'Kadın',
      description: 'Şık ve Modern',
    },
    {
      icon: <ManIcon sx={{ fontSize: 28 }} />,
      title: 'Erkek',
      description: 'Güçlü ve Tarz',
    },
    {
      icon: <ChildCareIcon sx={{ fontSize: 28 }} />,
      title: 'Çocuk',
      description: 'Sevimli ve Rahat',
    },
  ];

  const howItWorks = [
    {
      icon: <PaymentsIcon sx={{ fontSize: 40 }} />,
      title: 'Üye Ol, Limitini Al',
      description: 'Hemen üye ol, 2500₺ başlangıç limitin hazır'
    },
    {
      icon: <LocalOfferIcon sx={{ fontSize: 40 }} />,
      title: 'Alışverişini Yap',
      description: 'Mağazamızdan dilediğin ürünleri seç'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Taksitini Öde',
      description: 'Düzenli ödemelerle limitini artır'
    },
    {
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      title: '1 Ay Erteleme',
      description: 'İhtiyaç halinde faizsiz erteleme imkanı'
    }
  ];

  const features = [
    {
      icon: <PersonAddIcon sx={{ fontSize: 60, color: 'white' }} />,
      title: 'Hemen üye ol, anında alışverişe başla',
      description: 'Dakikalar içinde üyeliğinizi oluşturun ve hemen alışverişe başlayın.'
    },
    {
      icon: <PaymentsIcon sx={{ fontSize: 60, color: 'white' }} />,
      title: 'Bütçene uygun taksit seçenekleri',
      description: 'Size özel taksit seçenekleriyle ödemelerinizi kolayca planlayın.'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 60, color: 'white' }} />,
      title: 'Düzenli ödemelerle yükselen limitler',
      description: 'Ödemelerinizi düzenli yapın, alışveriş limitiniz otomatik artsın.'
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 60, color: 'white' }} />,
      title: '1 ay faizsiz erteleme imkanı',
      description: 'İhtiyaç duyduğunuzda ödemelerinizi 1 ay faizsiz erteleyin.'
    }
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Email adresinizi girin');
      setMessageType('error');
      return;
    }

    try {
      await emailAPI.subscribe(email);
      setMessage('✓ Mail listemize kaydoldunuz');
      setMessageType('success');
      setEmail('');
    } catch (error) {
      setMessage('Kayıt başarısız');
      setMessageType('error');
    }
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="fixed" sx={{ background: 'rgba(0, 0, 0, 0.95)' }}>
        <StyledToolbar>
          <Box 
            component="img" 
            src="/markalogo-w.png"
            alt="Marka World Logo"
            sx={{ 
              height: { xs: 35, sm: 40, md: 45 },
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />
          
          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => scrollToSection('how-it-works')}>Nasıl Çalışır</MenuItem>
                <MenuItem onClick={() => scrollToSection('products')}>Ürünler</MenuItem>
                <MenuItem onClick={() => scrollToSection('features')}>Avantajlar</MenuItem>
                <MenuItem onClick={() => scrollToSection('contact')}>İletişim</MenuItem>
                <MenuItem onClick={() => navigate('/customer-login')}>Giriş Yap</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <MenuContainer>
                <Button color="inherit" onClick={() => scrollToSection('how-it-works')}>
                  Nasıl Çalışır
                </Button>
                <Button color="inherit" onClick={() => scrollToSection('products')}>
                  Ürünler
                </Button>
                <Button color="inherit" onClick={() => scrollToSection('features')}>
                  Avantajlar
                </Button>
                <Button color="inherit" onClick={() => scrollToSection('contact')}>
                  İletişim
                </Button>
              </MenuContainer>
              
              <Button
                variant="contained"
                onClick={() => navigate('/customer-login')}
                sx={{
                  bgcolor: 'white',
                  color: 'black',
                  px: 4,
                  py: 1,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: '25px',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Giriş Yap
              </Button>
            </>
          )}
        </StyledToolbar>
      </AppBar>
      <Toolbar />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            component="img"
            src="markalogo-w.png"
            alt="Marka World Logo"
            sx={{
              width: { xs: '90%', sm: '70%', md: '50%' },
              maxWidth: 500,
              height: 'auto',
              mb: { xs: 2, sm: 3 },
              filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.6))',
              animation: 'glowPulse 3s ease-in-out infinite',
              '@keyframes glowPulse': {
                '0%': {
                  filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.6))',
                },
                '50%': {
                  filter: 'brightness(0) invert(1) drop-shadow(0 0 15px rgba(255,255,255,0.8))',
                },
                '100%': {
                  filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.6))',
                },
              },
            }}
          />
          <Typography
            variant="h4"
            sx={{
              mb: { xs: 3, sm: 4 },
              fontWeight: 300,
              color: 'white',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Uygun Fiyata Marka Ürünler
          </Typography>
          <Box sx={{ mt: { xs: 2, sm: 4 } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              startIcon={<PersonAddIcon />}
              sx={{
                bgcolor: 'white',
                color: 'black',
                px: 4,
                py: 1.5,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                borderRadius: '30px',
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              2500₺ Limit Al
            </Button>
            <Typography
              variant="h6"
              sx={{
                mt: 3,
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              2500₺ Başlangıç Limiti - Kredi Kartına Gerek Yok!
            </Typography>
          </Box>
        </Container>
      </HeroSection>

      {/* Nasıl Çalışır */}
      <Box id="how-it-works" sx={{ py: 12, scrollMarginTop: '64px', bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ mb: 8, color: 'black' }}>
            Nasıl Çalışır?
          </Typography>
          <Grid container spacing={6}>
            {howItWorks.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <FeatureBox>
                  <FeatureIcon>
                    {step.icon}
                  </FeatureIcon>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'black' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {step.description}
                  </Typography>
                  {index < howItWorks.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: '-30%',
                        top: '40px',
                        width: '60%',
                        height: '2px',
                        bgcolor: 'grey.300',
                        display: { xs: 'none', md: 'block' }
                      }}
                    />
                  )}
                </FeatureBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Kategoriler */}
      <Box id="products" sx={{ bgcolor: 'black', py: 12, scrollMarginTop: '64px' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{
              color: 'white',
              mb: 8,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 100,
                height: 3,
                bgcolor: 'white',
              },
            }}
          >
            Her Tarza Uygun
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {categories.map((category) => (
              <Grid item xs={12} sm={4} key={category.title}>
                <CategoryBox>
                  {React.cloneElement(category.icon, { sx: { fontSize: 48 } })}
                  <Typography variant="h5" color="white" gutterBottom>
                    {category.title}
                  </Typography>
                  <Typography variant="body1" color="grey.400" align="center">
                    {category.description}
                  </Typography>
                </CategoryBox>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="h4" color="white" gutterBottom>
              Tüm Aile İçin Marka Ürünler
            </Typography>
            <Typography variant="body1" color="grey.400" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              En sevdiğiniz markaların en yeni koleksiyonlarını uygun fiyatlarla sizlerle buluşturuyoruz.
              Kadın, erkek ve çocuk kategorilerinde binlerce ürün sizi bekliyor.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Bülten Kayıt */}
      <NewsletterBox>
        <Container maxWidth="sm">
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'black' }}>
            Fırsatlardan Haberdar Olun
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Yeni ürünler ve özel kampanyalardan ilk siz haberdar olun.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Email Adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  bgcolor: 'background.paper'
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSubscribe}
              sx={{
                bgcolor: 'black',
                color: 'white',
                px: 4,
                borderRadius: '30px',
                '&:hover': {
                  bgcolor: 'grey.900',
                },
                whiteSpace: 'nowrap'
              }}
            >
              Abone Ol
            </Button>
          </Box>
          {message && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 2, 
                color: messageType === 'success' ? 'success.main' : 'error.main',
                textAlign: 'center'
              }}
            >
              {message}
            </Typography>
          )}
        </Container>
      </NewsletterBox>

      {/* Özellikler */}
      <Box id="features" sx={{ bgcolor: 'black', py: 8, scrollMarginTop: '64px' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ 
            mb: 8,
            color: 'white',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 3,
              bgcolor: 'white',
            },
          }}>
            Avantajlarımız
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 2,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="grey.400">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* İletişim */}
      <Box id="contact" sx={{ scrollMarginTop: '64px', bgcolor: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom align="center" sx={{ 
            mb: 8, 
            color: 'black',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 3,
              bgcolor: 'black',
            },
          }}>
            Bize Ulaşın
          </Typography>

          <Grid container spacing={6}>
            {/* Sol Taraf - İletişim Bilgileri */}
            <Grid item xs={12} md={5}>
              <Box sx={{ 
                bgcolor: 'black', 
                p: 4, 
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s ease',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-5px)',
                }
              }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: 'white' }}>
                  İletişim Bilgileri
                </Typography>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOnIcon sx={{ color: '#fff' }} />
                    <Box>
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        Karşıyaka, Vali Ayhan Çevik Cd. 46/A
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        60000 Tokat Merkez/Tokat
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PhoneIcon sx={{ color: '#fff' }} />
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      (0356) 502 78 99
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MailOutlineIcon sx={{ color: '#fff' }} />
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                      info@markaworld.com.tr
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ 
                  mt: 6,
                  pt: 4, 
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: 4
                }}>
                  <IconButton
                    href="https://www.instagram.com/markaworldtokat"
                    target="_blank"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <InstagramIcon />
                  </IconButton>
                  <IconButton
                    href="https://wa.me/905368324660"
                    target="_blank"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <WhatsAppIcon />
                  </IconButton>
                  <IconButton
                    href="https://g.co/kgs/mLGTxNA"
                    target="_blank"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <LocationOnIcon />
                  </IconButton>
                </Box>
              </Box>
            </Grid>

            {/* Sağ Taraf - Harita */}
            <Grid item xs={12} md={7}>
              <Box sx={{ 
                height: '100%',
                minHeight: 400,
                borderRadius: 2,
                overflow: 'hidden',
                border: '4px solid rgba(0,0,0,0.1)',
              }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3040.8700041204434!2d36.538942076860806!3d40.34522967145135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x407dbbbaf9bc68a9%3A0x65ebef1ec2f5d8e6!2sMarka%20World%20Tokat!5e0!3m2!1str!2str!4v1750463255138!5m2!1str!2str"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: 'black', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                mb: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box>
                  <Box
                    component="img"
                    src="markalogo-w.png"
                    alt="Marka World Logo"
                    sx={{
                      width: { xs: 180, sm: 200, md: 220 },
                      height: 'auto',
                      mb: 2,
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                  <Typography variant="body1" sx={{ color: 'grey.400' }}>
                    Uygun Fiyata Marka Ürünler
                  </Typography>
                </Box>
                <Stack spacing={1} sx={{ color: 'grey.400', mt: 2 }}>
                  <Typography variant="body2">
                    Karşıyaka, Vali Ayhan Çevik Cd. 46/A
                  </Typography>
                  <Typography variant="body2">
                    60000 Tokat Merkez/Tokat
                  </Typography>
                  <Typography variant="body2">
                    (0356) 502 78 99
                  </Typography>
                </Stack>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Hızlı Bağlantılar
              </Typography>
              <Stack spacing={2}>
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => scrollToSection('how-it-works')}
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  Nasıl Çalışır?
                </MuiLink>
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => scrollToSection('features')}
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  Avantajlar
                </MuiLink>
                <MuiLink
                  component={RouterLink}
                  to="/register"
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  Abone Ol
                </MuiLink>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Sözleşmeler
              </Typography>
              <Stack spacing={2}>
                <MuiLink
                  component={RouterLink}
                  to="/privacy-policy"
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  Gizlilik Politikası
                </MuiLink>
                <MuiLink
                  component={RouterLink}
                  to="/terms"
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  Kullanım Koşulları
                </MuiLink>
                <MuiLink
                  component={RouterLink}
                  to="/kvkk"
                  sx={{ color: 'grey.400', textAlign: 'left', '&:hover': { color: 'white' } }}
                >
                  KVKK Aydınlatma Metni
                </MuiLink>
              </Stack>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              © 2025 Marka World. | Tasarım{' '}
              <MuiLink
                href="https://3kareajans.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: 'grey.400',
                  textDecoration: 'none',
                  '&:hover': { 
                    color: 'white',
                    textDecoration: 'underline'
                  }
                }}
              >
                3 Kare Ajans
              </MuiLink>
            </Typography>
          </Box>
        </Container>
      </Box>

      <ScrollTop>
        <StyledFab size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </StyledFab>
      </ScrollTop>
    </Box>
  );
};

export default Home; 