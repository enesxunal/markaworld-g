import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      light: '#f5f5f5',
      dark: '#e0e0e0',
      contrastText: '#000000',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
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
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '0.95rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    body1: {
      fontSize: '0.9rem',
      color: '#000000',
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
    body2: {
      fontSize: '0.8rem',
      color: '#666666',
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
      },
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '@media (max-width:600px)': {
            minHeight: '56px',
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            minHeight: '56px',
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          '@media (max-width:600px)': {
            borderRadius: '6px',
            margin: '4px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            borderRadius: '6px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          '@media (max-width:600px)': {
            minHeight: '44px',
            fontSize: '0.8rem',
            padding: '10px 20px',
          },
        },
        contained: {
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        outlined: {
          borderColor: '#000000',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#000000',
          },
        },
        sizeLarge: {
          '@media (max-width:600px)': {
            minHeight: '48px',
            fontSize: '0.85rem',
            padding: '12px 24px',
          },
        },
        sizeSmall: {
          '@media (max-width:600px)': {
            minHeight: '36px',
            fontSize: '0.75rem',
            padding: '8px 16px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            '@media (max-width:600px)': {
              fontSize: '16px', // iOS zoom önleme
            },
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#000000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
            },
          },
          '& .MuiInputLabel-root': {
            '@media (max-width:600px)': {
              fontSize: '0.85rem',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '@media (max-width:600px)': {
            fontSize: '0.7rem',
            height: '24px',
          },
        },
        sizeSmall: {
          '@media (max-width:600px)': {
            fontSize: '0.65rem',
            height: '20px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '6px 4px',
            fontSize: '0.7rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:600px)': {
            margin: '8px',
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          '@media (max-width:600px)': {
            width: '260px',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '0.75rem',
            padding: '8px 12px',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            lineHeight: 1.4,
          },
        },
      },
    },
  },
});

export default theme; 