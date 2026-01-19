import { Box, Container, Typography, Link, Stack } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      sx={{
        backgroundColor: '#F2F2F7',
        py: 6,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={4}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
              }}
            >
              Elepad
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Conectando generaciones con amor
            </Typography>
          </Box>

          <Stack spacing={2} sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Enlaces
            </Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Sobre Nosotros
            </Link>
            <Link
              href="#"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Contacto
            </Link>
            <Link
              component={RouterLink}
              to="/privacidad"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Política de Privacidad
            </Link>
          </Stack>

          <Stack spacing={2} sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Legal
            </Typography>
            <Link
              component={RouterLink}
              to="/eliminar-cuenta"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Eliminar Cuenta
            </Link>
            <Link
              href="#"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Términos de Servicio
            </Link>
            <Link
              href="#"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Ayuda
            </Link>
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 6,
            pt: 4,
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            Hecho con <Favorite sx={{ color: 'primary.main', fontSize: 18 }} /> para
            todas las familias
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            © {new Date().getFullYear()} Elepad. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
