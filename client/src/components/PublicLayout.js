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
  Link as MuiLink,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Özel stil bileşenleri
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

const PublicLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const scrollToSection = (sectionId) => {
    navigate('/#' + sectionId);
    handleClose();
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

      {/* Main Content */}
      <Box component="main" sx={{ minHeight: 'calc(100vh - 400px)' }}>
        {children}
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
                    src="/markalogo-w.png"
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
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
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
                  sx={{
                    color: 'grey.400',
                    textDecoration: 'none',
                    textAlign: 'left',
                    '&:hover': { color: 'white' }
                  }}
                >
                  Gizlilik Politikası
                </MuiLink>
                <MuiLink
                  component={RouterLink}
                  to="/terms"
                  sx={{
                    color: 'grey.400',
                    textDecoration: 'none',
                    textAlign: 'left',
                    '&:hover': { color: 'white' }
                  }}
                >
                  Kullanım Koşulları
                </MuiLink>
                <MuiLink
                  component={RouterLink}
                  to="/kvkk"
                  sx={{
                    color: 'grey.400',
                    textDecoration: 'none',
                    textAlign: 'left',
                    '&:hover': { color: 'white' }
                  }}
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
    </Box>
  );
};

export default PublicLayout; 