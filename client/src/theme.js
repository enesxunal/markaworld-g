import { createTheme } from '@mui/material/styles';
import { BRAND } from './styles/brand';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.black,
      light: '#333333',
      dark: BRAND.black,
      contrastText: BRAND.white,
    },
    secondary: {
      main: BRAND.accent,
      light: BRAND.accentLight,
      dark: BRAND.accentDark,
      contrastText: BRAND.black,
    },
    background: {
      default: BRAND.warmWhite,
      paper: BRAND.white,
    },
    text: {
      primary: BRAND.black,
      secondary: BRAND.warmGray,
    },
    success: {
      main: BRAND.success,
      light: BRAND.successBg,
      dark: BRAND.success,
    },
    warning: {
      main: BRAND.warning,
      light: BRAND.warningBg,
      dark: BRAND.warning,
    },
    error: {
      main: BRAND.error,
      light: BRAND.errorBg,
      dark: BRAND.error,
    },
    divider: BRAND.border,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { bgcolor: BRAND.warmWhite },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.black,
          color: BRAND.white,
          boxShadow: 'none',
          borderBottom: `1px solid ${BRAND.borderDark}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 72,
          '@media (max-width:600px)': { minHeight: 64 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          borderRadius: 8,
          border: `1px solid ${BRAND.border}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 8 },
        outlined: { borderColor: BRAND.border },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: BRAND.black,
          color: BRAND.white,
          '&:hover': { backgroundColor: '#333' },
        },
        containedSecondary: {
          backgroundColor: BRAND.accent,
          color: BRAND.black,
          '&:hover': { backgroundColor: BRAND.accentDark },
        },
        outlined: {
          borderColor: BRAND.border,
          color: BRAND.black,
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, borderColor: BRAND.black, bgcolor: 'rgba(0,0,0,0.03)' },
        },
        sizeLarge: {
          '@media (max-width:600px)': { minHeight: 48, fontSize: '0.95rem' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: BRAND.border },
            '&:hover fieldset': { borderColor: BRAND.black },
            '&.Mui-focused fieldset': { borderColor: BRAND.black },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          bgcolor: BRAND.warmWhite,
          fontWeight: 700,
          color: BRAND.black,
          fontSize: '0.8rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: `1px solid ${BRAND.border}`,
        },
        root: {
          borderBottom: `1px solid ${BRAND.border}`,
          '@media (max-width:600px)': { padding: '8px 6px', fontSize: '0.8rem' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { bgcolor: BRAND.black, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          color: BRAND.warmGray,
          '&.Mui-selected': { color: BRAND.black },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
          '@media (max-width:600px)': {
            margin: 8,
            width: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { '@media (max-width:600px)': { width: 280 } },
      },
    },
  },
});

export default theme;
