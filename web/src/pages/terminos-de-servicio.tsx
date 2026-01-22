import Navbar from '../components/Navbar';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function TerminosDeServicio() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              {t('terms.title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              {t('terms.description')}
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - {t('terms.rules.rule1')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - {t('terms.rules.rule2')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                - {t('terms.rules.rule3')}
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}