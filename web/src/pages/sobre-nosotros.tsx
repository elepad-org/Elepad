import { Container, Typography, Box, Avatar, Grid } from '@mui/material';

const integrantes = [
  { nombre: 'Andrés Leandro', img: '' },
  { nombre: 'Integrante 2', img: '' },
  { nombre: 'Integrante 3', img: '' },
  { nombre: 'Integrante 4', img: '' },
  { nombre: 'Integrante 5', img: '' },
];

export default function SobreNosotros() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>Sobre Nosotros</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Somos 5 desarrolladores de software e ingenieros en sistemas, egresados de la UTN Regional Resistencia. Buscamos transformar a las familias a través de la tecnología, creando herramientas que fortalezcan los vínculos y generen experiencias significativas entre generaciones.
      </Typography>
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Nuestro equipo
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {integrantes.map((integrante, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, boxShadow: 2, borderRadius: 3, background: '#fff' }}>
                <Avatar src={integrante.img} sx={{ width: 96, height: 96, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>{integrante.nombre}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}