import LegalNavbar from '../components/LegalNavbar';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Ayuda() {
  return (
    <>
      <LegalNavbar />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              Ayuda
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              Aquí encontrarás respuestas a las preguntas más frecuentes y recursos para obtener soporte.
            </Typography>
            <Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿Cómo creo una cuenta?</AccordionSummary>
                <AccordionDetails>Para crear una cuenta, haz clic en "Registrarse" y completa el formulario con tus datos.</AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿Cómo restablezco mi contraseña?</AccordionSummary>
                <AccordionDetails>En la pantalla de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y sigue los pasos indicados.</AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿Cómo contacto al soporte?</AccordionSummary>
                <AccordionDetails>Puedes escribirnos desde la página de contacto y te responderemos a la brevedad.</AccordionDetails>
              </Accordion>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}