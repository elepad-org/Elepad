import LegalNavbar from '../components/LegalNavbar';
import { Container, Typography, Box, Paper } from '@mui/material';

export default function TerminosDeServicio() {
  return (
    <>
      <LegalNavbar />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              Términos de Servicio
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              Al utilizar Elepad, aceptas nuestros términos y condiciones. Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso de la plataforma implica la aceptación de las políticas de privacidad y el compromiso de utilizar el servicio de manera responsable y respetuosa.
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - No compartas información personal de terceros sin consentimiento.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - No utilices la plataforma para actividades ilícitas o dañinas.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - Respeta la privacidad y seguridad de todos los usuarios.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}