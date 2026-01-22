import Navbar from '../components/Navbar';
import { Container, Typography, Box, Avatar, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

const integrantes = [
  { nombre: 'André San Lorenzo', img: '' },
  { nombre: 'Integrante 2', img: '' },
  { nombre: 'Integrante 3', img: '' },
  { nombre: 'Integrante 4', img: '' },
  { nombre: 'Integrante 5', img: '' },
];

export default function SobreNosotros() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              {t('about.title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              {t('about.description')}
            </Typography>
            <Box sx={{ mt: 6 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                {t('about.team')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                {integrantes.map((integrante, idx) => (
                  <Box key={idx} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 22px)' }, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, boxShadow: 2, borderRadius: 3, background: '#fff' }}>
                    <Avatar src={integrante.img} sx={{ width: 96, height: 96, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>{integrante.nombre}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}