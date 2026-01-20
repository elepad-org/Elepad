import { Container, Typography, Box } from '@mui/material';

export default function TerminosDeServicio() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Términos de Servicio</Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Al utilizar Elepad, aceptas nuestros términos y condiciones. Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso de la plataforma implica la aceptación de las políticas de privacidad y el compromiso de utilizar el servicio de manera responsable y respetuosa.
        </Typography>
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
    </Container>
  );
}