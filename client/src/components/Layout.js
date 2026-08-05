import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
  Button,
  Stack,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { clearAdminSession, clearCustomerSession } from '../utils/apiAuth';
import { BRAND } from '../styles/brand';
import SeoHead from './SeoHead';
import { SEO_PAGES } from '../seo/siteConfig';
import {
  ExitToApp,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as SalesIcon,
  Payment as PaymentsIcon,
  Backup as BackupIcon,
  Email as EmailIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const Layout = ({ isAdmin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    if (isAdmin) {
      clearAdminSession();
      navigate('/admin/login');
    } else {
      clearCustomerSession();
      navigate('/customer-login');
    }
  };

  const adminMenuItems = [
    { text: 'Panel', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Müşteriler', icon: <PeopleIcon />, path: '/admin/customers' },
    { text: 'Satışlar', icon: <SalesIcon />, path: '/admin/sales' },
    { text: 'Ödemeler', icon: <PaymentsIcon />, path: '/admin/future-payments' },
    { text: 'Yedekler', icon: <BackupIcon />, path: '/admin/backups' },
    { text: 'Toplu Mail', icon: <EmailIcon />, path: '/admin/bulk-email' },
  ];

  const customerMenuItems = [
    { text: 'Profilim', icon: <PersonIcon />, path: '/customer/profile' },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navButtonSx = (active) => ({
    color: active ? BRAND.accent : 'rgba(255,255,255,0.75)',
    fontSize: '0.9rem',
    fontWeight: active ? 700 : 500,
    px: 1.5,
    py: 0.75,
    minWidth: 'auto',
    borderRadius: 1,
    bgcolor: active ? 'rgba(201,184,150,0.12)' : 'transparent',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: BRAND.white },
  });

  const drawerContent = (
    <Box sx={{ width: 280, bgcolor: BRAND.black, color: BRAND.white, height: '100%' }}>
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${BRAND.borderDark}` }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Marka World"
          sx={{ height: 40, filter: 'brightness(0) invert(1)' }}
        />
        <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
          {isAdmin ? 'YÖNETİM PANELİ' : 'MÜŞTERİ PANELİ'}
        </Box>
      </Box>
      <List sx={{ py: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => { navigate(item.path); setDrawerOpen(false); }}
            sx={{
              py: 1.5,
              color: isActive(item.path) ? BRAND.accent : 'rgba(255,255,255,0.8)',
              bgcolor: isActive(item.path) ? 'rgba(201,184,150,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: BRAND.borderDark }} />
      <List>
        <ListItemButton onClick={handleLogout} sx={{ py: 1.5, color: 'rgba(255,255,255,0.7)' }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><ExitToApp /></ListItemIcon>
          <ListItemText primary="Çıkış" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </List>
    </Box>
  );

  const panelSeo = isAdmin ? SEO_PAGES.adminApp : SEO_PAGES.customerApp;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <SeoHead
        title={panelSeo.title}
        description={panelSeo.description}
        robots={panelSeo.robots}
        noCanonical
      />
      <AppBar position="fixed" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {isMobile && (
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Menü">
                <MenuIcon />
              </IconButton>
            )}
            <Box
              component="img"
              src="/logo.png"
              alt="Marka World"
              onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/customer/profile')}
              sx={{ height: { xs: 36, md: 42 }, cursor: 'pointer', filter: 'brightness(0) invert(1)' }}
            />
          </Stack>

          {!isMobile && isAdmin && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, justifyContent: 'center' }}>
              {adminMenuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={navButtonSx(isActive(item.path))}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}

          {!isMobile && !isAdmin && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, justifyContent: 'center' }}>
              {customerMenuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={navButtonSx(isActive(item.path))}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}

          <IconButton color="inherit" onClick={handleLogout} aria-label="Çıkış" sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 10, md: 11 },
          pb: 4,
          px: { xs: 0, md: 0 },
        }}
      >
        <Container maxWidth={isAdmin ? 'xl' : 'lg'}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
