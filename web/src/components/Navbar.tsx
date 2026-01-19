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
        borderBottom: '1px solid',
        borderColor: 'divider',
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
                  backgroundColor: 'transparent',
                  color: 'primary.main',
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
                  backgroundColor: 'transparent',
                  color: 'primary.main',
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
                boxShadow: '0 2px 8px rgba(154, 158, 206, 0.3)',
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
