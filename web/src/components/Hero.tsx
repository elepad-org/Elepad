import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ArrowForward, Download } from '@mui/icons-material';

export default function Hero() {
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
              Bienvenido a{' '}
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                  display: 'inline-block',
                }}
              >
                Elepad
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
              La plataforma que conecta generaciones a través de juegos
              cognitivos, recuerdos compartidos y momentos especiales.
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
                Descargar App
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
                Saber Más
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
                width: { xs: '280px', sm: '350px', md: '450px' },
                height: { xs: '280px', sm: '350px', md: '450px' },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9a9ece 0%, #9eadc8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(154, 158, 206, 0.3)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'inherit',
                  filter: 'blur(40px)',
                  opacity: 0.5,
                  zIndex: -1,
                },
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '3rem', md: '4rem' },
                }}
              >
                🐘
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
