import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { Apple, Android } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function CTA() {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(135deg, #9a9ece 0%, #424a70 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(80px)',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.8rem', lg: '3.2rem' },
              fontWeight: 700,
              color: 'white',
              mb: 3,
              letterSpacing: '-0.01em',
            }}
          >
            {t('cta.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 5,
              fontSize: { xs: '1rem', md: '1.2rem' },
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            {t('cta.description')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'center' }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Apple />}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              {t('cta.appStore')}
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Android />}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              {t('cta.googlePlay')}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
