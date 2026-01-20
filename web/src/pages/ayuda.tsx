import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Ayuda() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Ayuda</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
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
    </Container>
  );
}