import Navbar from '../components/Navbar';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';

export default function Contacto() {
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              Contacto
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              Si tienes dudas, sugerencias o quieres comunicarte con nosotros, completa el siguiente formulario y te responderemos a la brevedad.
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Nombre" variant="outlined" required />
              <TextField label="Email" variant="outlined" type="email" required />
              <TextField label="Mensaje" variant="outlined" multiline rows={4} required />
              <Button variant="contained" color="primary" sx={{ mt: 2 }}>Enviar</Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}