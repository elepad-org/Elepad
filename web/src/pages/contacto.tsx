import Navbar from '../components/Navbar';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Contacto() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              {t('contact.title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              {t('contact.description')}
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label={t('contact.name')} variant="outlined" required />
              <TextField label={t('contact.email')} variant="outlined" type="email" required />
              <TextField label={t('contact.message')} variant="outlined" multiline rows={4} required />
              <Button variant="contained" color="primary" sx={{ mt: 2 }}>{t('contact.send')}</Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}