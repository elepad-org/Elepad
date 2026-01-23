import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ArrowForward, Download } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import eleSvg from '/ele.svg';


export default function Hero() {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: '#9eadc8',
          opacity: 0.1,
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: '#9a9ece',
          opacity: 0.08,
          filter: 'blur(100px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 6, md: 8 },
            py: { xs: 8, md: 12 },
          }}
        >
          {/* Content */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              {t('hero.title')}{' '}
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  display: 'inline-block',
                }}
              >
                {t('hero.elepad')}
              </Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                color: 'text.secondary',
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '600px',
                mx: { xs: 'auto', md: 0 },
              }}
            >
              {t('hero.subtitle')}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<Download />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 14px rgba(154, 158, 206, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(154, 158, 206, 0.5)',
                  },
                }}
              >
                {t('nav.download')}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'rgba(154, 158, 206, 0.05)',
                  },
                }}
              >
                {t('nav.features')}
              </Button>
            </Stack>
          </Box>

          {/* Image/Illustration placeholder */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: { xs: '340px', sm: '420px', md: '540px' },
                height: { xs: '340px', sm: '420px', md: '540px' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={eleSvg}
                alt="Elepad"
                sx={{
                  width: '84%',
                  height: '84%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.12))',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
