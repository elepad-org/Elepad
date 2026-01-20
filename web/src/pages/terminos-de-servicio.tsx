import { Container, Typography } from '@mui/material';

export default function TerminosDeServicio() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Términos de Servicio</Typography>
      <Typography variant="body1">Aquí van los términos de servicio de Elepad.</Typography>
    </Container>
  );
}