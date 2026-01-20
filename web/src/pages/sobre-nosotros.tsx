import { Container, Typography } from '@mui/material';

export default function SobreNosotros() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Sobre Nosotros</Typography>
      <Typography variant="body1">Esta es la página de información sobre Elepad.</Typography>
    </Container>
  );
}