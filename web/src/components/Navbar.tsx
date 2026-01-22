import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Download } from '@mui/icons-material';

export default function Navbar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
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
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                display: { xs: 'none', md: 'inline-flex' },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Características
            </Button>
            <Button
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                display: { xs: 'none', md: 'inline-flex' },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
