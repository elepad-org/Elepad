import { Box, Typography, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      sx={{
        backgroundColor: '#F2F2F7',
        py: 6,
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 4,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={20}
        sx={{
          justifyContent: 'center',
          alignItems: { xs: 'center', md: 'flex-start' },
          textAlign: { xs: 'center', md: 'left' },
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >

          <Stack spacing={2} sx={{ alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Enlaces
            </Typography>
            <Link
              component={RouterLink}
              to="/sobre-nosotros"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Sobre Nosotros
            </Link>
            <Link
              component={RouterLink}
              to="/contacto"
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
              component={RouterLink}
              to="/terminos-de-servicio"
              underline="hover"
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              Términos de Servicio
            </Link>
            <Link
              component={RouterLink}
              to="/ayuda"
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
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                © {new Date().getFullYear()} Todos los derechos reservados.
          </Typography>
        </Box>
    </Box>
  );
}
