import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Download, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface NavbarProps {
  variant?: 'main' | 'legal';
}

export default function Navbar({ variant = 'main' }: NavbarProps) {
  const { t } = useTranslation();
  const handleScrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        py: -0.1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', mx: 4 }}>
          <Typography         
            sx={{
              fontWeight: 700,
              fontFamily: 'Lobster',
              fontSize: '2.75rem',
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            Elepad
          </Typography>

          {variant === 'main' ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                onClick={handleScrollToFeatures}
                variant="text"
                color="primary"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(154, 158, 206, 0.05)',
                    boxShadow: 'none',
                  },
                }}
              >
                {t('nav.features')}
              </Button>
              <Button
                component={RouterLink}
                to="/sobre-nosotros"
                variant="text"
                color="primary"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(154, 158, 206, 0.05)',
                    boxShadow: 'none',
                  },
                }}
              >
                {t('nav.about')}
              </Button>
              <LanguageSelector />
              <Button
                variant="contained"
                color="primary"
                startIcon={<Download />}
                disableElevation
                sx={{
                  px: 3,
                }}
              >
                {t('nav.download')}
              </Button>
            </Box>
          ) : (
            <Button
              component={RouterLink}
              to="/"
              startIcon={<ArrowBack />}
              variant="text"
              color="primary"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(154, 158, 206, 0.05)',
                  boxShadow: 'none',
                },
              }}
            >
              {t('nav.backToHome')}
            </Button>
          )}
        </Toolbar>
      </AppBar>
  );
}
