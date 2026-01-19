import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9a9ece',
      dark: '#7374a7',
      light: '#9eadc8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424a70',
      light: '#9eadc8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F2F2F7',
    },
    text: {
      primary: '#000000',
      secondary: '#7374a7',
    },
    success: {
      main: '#6B8DD6',
    },
    divider: '#E5E5EA',
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 8px rgba(0, 0, 0, 0.04)',
    '0 4px 12px rgba(0, 0, 0, 0.08)',
    '0 6px 16px rgba(0, 0, 0, 0.12)',
    '0 8px 20px rgba(0, 0, 0, 0.12)',
    '0 10px 24px rgba(0, 0, 0, 0.12)',
    '0 12px 28px rgba(0, 0, 0, 0.12)',
    '0 14px 32px rgba(0, 0, 0, 0.12)',
    '0 16px 36px rgba(0, 0, 0, 0.12)',
    '0 18px 40px rgba(0, 0, 0, 0.12)',
    '0 20px 44px rgba(0, 0, 0, 0.12)',
    '0 22px 48px rgba(0, 0, 0, 0.12)',
    '0 24px 52px rgba(0, 0, 0, 0.12)',
    '0 26px 56px rgba(0, 0, 0, 0.12)',
    '0 28px 60px rgba(0, 0, 0, 0.12)',
    '0 30px 64px rgba(0, 0, 0, 0.12)',
    '0 32px 68px rgba(0, 0, 0, 0.12)',
    '0 34px 72px rgba(0, 0, 0, 0.12)',
    '0 36px 76px rgba(0, 0, 0, 0.12)',
    '0 38px 80px rgba(0, 0, 0, 0.12)',
    '0 40px 84px rgba(0, 0, 0, 0.12)',
    '0 42px 88px rgba(0, 0, 0, 0.12)',
    '0 44px 92px rgba(0, 0, 0, 0.12)',
    '0 46px 96px rgba(0, 0, 0, 0.12)',
    '0 48px 100px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
  },
});

export default theme;
