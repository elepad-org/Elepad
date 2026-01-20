import { Container, Typography } from '@mui/material';

export default function Ayuda() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Ayuda</Typography>
      <Typography variant="body1">Aquí encontrarás ayuda y preguntas frecuentes.</Typography>
    </Container>
  );
}