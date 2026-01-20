import { Container, Typography, Box, TextField, Button } from '@mui/material';

export default function Contacto() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Contacto</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Si tienes dudas, sugerencias o quieres comunicarte con nosotros, completa el siguiente formulario y te responderemos a la brevedad.
      </Typography>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Nombre" variant="outlined" required />
        <TextField label="Email" variant="outlined" type="email" required />
        <TextField label="Mensaje" variant="outlined" multiline rows={4} required />
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>Enviar</Button>
      </Box>
    </Container>
  );
}