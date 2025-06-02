import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';

const drawerWidth = 240;
const mobileDrawerWidth = 260;

const menuItems = [
  { text: 'Ana Sayfa', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Müşteriler', icon: <PeopleIcon />, path: '/admin/customers' },
  { text: 'Satışlar', icon: <ShoppingCartIcon />, path: '/admin/sales' },
  { text: 'Yeni Satış', icon: <AddIcon />, path: '/admin/sales/new' },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    // Admin token'ını temizle
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ minHeight: '56px !important', px: isMobile ? 1 : 2 }}>
        <Box display="flex" alignItems="center" width="100%">
          <img 
            src="/logo.png" 
            alt="Marka World" 
            style={{ 
              height: isMobile ? '28px' : '32px', 
              marginRight: '8px' 
            }}
          />
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: 'bold'
            }}
          >
            Admin Panel
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{ px: isMobile ? 0.5 : 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                borderRadius: 1.5,
                minHeight: isMobile ? 40 : 44,
                mx: isMobile ? 0.5 : 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: isMobile ? 32 : 36,
                  '& .MuiSvgIcon-root': {
                    fontSize: isMobile ? '1.1rem' : '1.3rem'
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', px: isMobile ? 1 : 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {isMobile ? 'Marka World' : 'Müşteri Ödeme Takip Sistemi'}
          </Typography>
          <Button
            color="inherit"
            startIcon={!isMobile && <ExitToAppIcon sx={{ fontSize: '1rem' }} />}
            onClick={handleLogout}
            sx={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              minWidth: isMobile ? 'auto' : '100px',
              px: isMobile ? 1 : 1.5,
            }}
          >
            {isMobile ? <ExitToAppIcon sx={{ fontSize: '1rem' }} /> : 'Çıkış'}
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: mobileDrawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 2,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#fafafa',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }} />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout; 