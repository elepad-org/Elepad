import { Box, Container, Typography, Paper, Button, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Card, CardContent } from '@mui/material';
import { DeleteForever, Email, CheckCircle, Info, Schedule, ContentCopy } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

export default function AccountDeletion() {
  const { t } = useTranslation();
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">{/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
          <DeleteForever sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {t('accountDeletion.title')}
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {t('accountDeletion.subtitle')}
          </Typography>
        </Box>

        {/* Importante */}
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            {t('accountDeletion.warning.title')}
          </Typography>
          <Typography variant="body2">
            {t('accountDeletion.warning.description')}
          </Typography>
        </Alert>

        {/* Qué se Elimina */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <DeleteForever sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('accountDeletion.whatGetsDeleted.title')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            {t('accountDeletion.whatGetsDeleted.description')}
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.accountInfo')}
                secondary={t('accountDeletion.whatGetsDeleted.accountInfoDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.gameProgress')}
                secondary={t('accountDeletion.whatGetsDeleted.gameProgressDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.memories')}
                secondary={t('accountDeletion.whatGetsDeleted.memoriesDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.events')}
                secondary={t('accountDeletion.whatGetsDeleted.eventsDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.familyGroups')}
                secondary={t('accountDeletion.whatGetsDeleted.familyGroupsDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatGetsDeleted.activityHistory')}
                secondary={t('accountDeletion.whatGetsDeleted.activityHistoryDetails')}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Qué se Conserva */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Info sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('accountDeletion.whatRemains.title')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            {t('accountDeletion.whatRemains.description')}
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatRemains.systemLogs')}
                secondary={t('accountDeletion.whatRemains.systemLogsDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatRemains.backups')}
                secondary={t('accountDeletion.whatRemains.backupsDetails')}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary={t('accountDeletion.whatRemains.sharedContent')}
                secondary={t('accountDeletion.whatRemains.sharedContentDetails')}
              />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>{t('accountDeletion.whatRemains.note')}</strong>
            </Typography>
          </Alert>
        </Paper>

        {/* Proceso de Eliminación */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {t('accountDeletion.deletionProcess.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            {t('accountDeletion.deletionProcess.description')}
          </Typography>
          
          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t('accountDeletion.deletionProcess.step1.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('accountDeletion.deletionProcess.step1.description') }}>
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t('accountDeletion.deletionProcess.step2.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {t('accountDeletion.deletionProcess.step2.description')}
              </Typography>
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: 'primary.main', 
                color: 'white', 
                borderRadius: 2,
                textAlign: 'center',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <Email sx={{ fontSize: 20 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  proyectoelepad@gmail.com
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigator.clipboard.writeText('proyectoelepad@gmail.com')}
                  sx={{ 
                    color: 'white', 
                    minWidth: 'auto', 
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <ContentCopy sx={{ fontSize: 16 }} />
                </Button>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>{t('accountDeletion.deletionProcess.step2.subject')}</strong><br />
                <strong>{t('accountDeletion.deletionProcess.step2.include')}</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step2.items.name')} />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step2.items.email')} />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step2.items.confirmation')} />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step2.items.reason')} />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t('accountDeletion.deletionProcess.step3.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('accountDeletion.deletionProcess.step3.description')}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t('accountDeletion.deletionProcess.step4.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('accountDeletion.deletionProcess.step4.description') }}>
              </Typography>
              <List dense>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step4.items.cancel')} />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step4.items.deactivated')} />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary={t('accountDeletion.deletionProcess.step4.items.noAccess')} />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                {t('accountDeletion.deletionProcess.step5.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: t('accountDeletion.deletionProcess.step5.description') }}>
              </Typography>
            </CardContent>
          </Card>
        </Paper>


        {/* Contacto */}
        <Paper sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'primary.main', color: 'white', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {t('accountDeletion.contact.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            {t('accountDeletion.contact.description')}
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            href="mailto:proyectoelepad@gmail.com"
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.9)' 
              } 
            }}
          >
            {t('accountDeletion.contact.button')}
          </Button>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
