import { Box, Container, Typography, List, ListItem, ListItemText, ListItemIcon, Paper, Button } from '@mui/material';
import { Security, Email, Timer, Info, Camera, CalendarMonth, Notifications } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'black' }}>
            {t('privacy.title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('privacy.lastUpdated')}: {new Date().toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Introducción */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('privacy.introduction')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            {t('privacy.introductionText')}
          </Typography>
        </Paper>

        {/* Información que Recopilamos */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Security sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('privacy.dataCollection.title')}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataCollection.personalInfo')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('privacy.dataCollection.personalInfoDetails') }}>
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataCollection.usageData')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('privacy.dataCollection.usageDataDetails') }}>
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataCollection.userContent')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('privacy.dataCollection.userContentDetails') }}>
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataCollection.familyData')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('privacy.dataCollection.familyDataDetails') }}>
          </Typography>
        </Paper>


        {/* Almacenamiento y Seguridad */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timer sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('privacy.dataStorage.title')}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataStorage.location')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            {t('privacy.dataStorage.locationDetails')}
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataStorage.encryption')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            {t('privacy.dataStorage.encryptionDetails')}
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataStorage.retention')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            {t('privacy.dataStorage.retentionDetails')}
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            {t('privacy.dataStorage.backup')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'primary.main' }}>
            {t('privacy.dataStorage.backupDetails')}
          </Typography>
        </Paper>

       

        {/* Permisos de la Aplicación */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {t('privacy.permissions.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            {t('privacy.permissions.intro')}
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <Camera />
              </ListItemIcon>
              <ListItemText 
                primary={t('privacy.permissions.camera')}
                secondary={t('privacy.permissions.cameraDetails')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <CalendarMonth />
              </ListItemIcon>
              <ListItemText 
                primary={t('privacy.permissions.calendar')}
                secondary={t('privacy.permissions.calendarDetails')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary={t('privacy.permissions.notifications')}
                secondary={t('privacy.permissions.notificationsDetails')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Cambios en la Política */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {t('privacy.changes')}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            {t('privacy.changesDetails')}
          </Typography>
        </Paper>

        {/* Contacto */}
        <Paper sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'primary.main', color: 'white', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Email sx={{ mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('privacy.contact.title')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {t('privacy.contact.description')}
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            href="mailto:proyectoelepad@gmail.com"
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              fontWeight: 600,
              mt: 2,
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.9)' 
              } 
            }}
          >
            <Email sx={{ mr: 1 }} />
            {t('privacy.contact.button')}
          </Button>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
