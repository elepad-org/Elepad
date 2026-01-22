import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Download, ArrowForward } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '-0.01em',
            }}
          >
            Elepad
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              component={RouterLink}
              to="#features"
              variant="text"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(154, 158, 206, 0.05)',
                },
              }}
            >
              Características
            </Button>
            <Button
              component={RouterLink}
              to="/sobre-nosotros"
              variant="text"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(154, 158, 206, 0.05)',
                },
              }}
            >
              Sobre Nosotros
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              sx={{
                px: 3,
              }}
            >
              Descargar
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
