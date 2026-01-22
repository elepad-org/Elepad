import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Download } from '@mui/icons-material';
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
      <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1, px: 10 }}>
          <Typography         
            sx={{
              fontWeight: 700,
              fontFamily: 'Lobster',
              fontSize: '2.5rem',
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
              Características
            </Button>
            <Button
              component={RouterLink}
              to="/sobre-nosotros"
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
              Sobre Nosotros
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              disableElevation
              sx={{
                px: 3,
              }}
            >
              Descargar
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
  );
}
