import { AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function LegalNavbar() {
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

          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBack />}
            sx={{
              color: 'text.primary',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'primary.main',
              },
            }}
          >
            Volver al Inicio
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
