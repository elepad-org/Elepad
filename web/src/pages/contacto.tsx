import { Container, Typography } from '@mui/material';

export default function Contacto() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Contacto</Typography>
      <Typography variant="body1">Puedes contactarnos a través de este formulario.</Typography>
    </Container>
  );
}