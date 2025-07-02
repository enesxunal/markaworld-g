import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
  Button,
  Stack
} from '@mui/material';
import {
  ExitToApp,
  Person,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as SalesIcon,
  Payment as PaymentsIcon,
  Backup as BackupIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const Layout = ({ isAdmin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    } else {
      localStorage.removeItem('customer');
      navigate('/customer-login');
    }
  };

  const adminMenuItems = [
    {
      text: 'Panel',
      icon: <DashboardIcon />,
      path: '/admin/dashboard'
    },
    {
      text: 'Müşteriler',
      icon: <PeopleIcon />,
      path: '/admin/customers'
    },
    {
      text: 'Satışlar',
      icon: <SalesIcon />,
      path: '/admin/sales'
    },
    {
      text: 'Ödemeler',
      icon: <PaymentsIcon />,
      path: '/admin/future-payments'
    },
    {
      text: 'Yedekler',
      icon: <BackupIcon />,
      path: '/admin/backups'
    },
    {
      text: 'Toplu Mail',
      icon: <EmailIcon />,
      path: '/admin/bulk-email'
    }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: isAdmin ? 'primary.main' : 'background.paper',
          color: isAdmin ? 'primary.contrastText' : 'text.primary'
        }}
      >
        <Toolbar>
          {/* Logo ve Başlık */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: '200px' }}>
            <img 
              src="/logo.png" 
              alt="Marka World" 
              style={{ 
                height: isMobile ? '32px' : '40px',
                width: 'auto',
                filter: isAdmin ? 'brightness(0) invert(1)' : 'none'
              }}
            />
          </Stack>

          {/* Menü Öğeleri */}
          {isAdmin && !isMobile && (
            <Stack 
              direction="row" 
              spacing={1}
              alignItems="center"
              sx={{ 
                flex: 1,
                justifyContent: 'center',
                '& .MuiButton-root': {
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              }}
            >
              {adminMenuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}

          {/* Çıkış Butonu */}
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{ 
              ml: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${theme.mixins.toolbar.minHeight + (isMobile ? 16 : 24)}px`,
          pb: 3
        }}
      >
        <Container maxWidth={isAdmin ? "xl" : "lg"}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 