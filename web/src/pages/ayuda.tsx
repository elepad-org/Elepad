import Navbar from '../components/Navbar';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';

export default function Ayuda() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main', textAlign: 'center' }}>
              {t('help.title')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              {t('help.description')}
            </Typography>
            <Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {t('help.faq.createAccount.question')}
                </AccordionSummary>
                <AccordionDetails>
                  {t('help.faq.createAccount.answer')}
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {t('help.faq.resetPassword.question')}
                </AccordionSummary>
                <AccordionDetails>
                  {t('help.faq.resetPassword.answer')}
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  {t('help.faq.contactSupport.question')}
                </AccordionSummary>
                <AccordionDetails>
                  {t('help.faq.contactSupport.answer')}
                </AccordionDetails>
              </Accordion>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}