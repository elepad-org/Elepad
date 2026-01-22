import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function LegalNavbar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: 'Lobster_400Regular',
              fontSize: '2rem',
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
            Volver al Inicio
          </Button>
        </Toolbar>
    </AppBar>
  );
}
