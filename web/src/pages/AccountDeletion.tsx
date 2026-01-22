import { Box, Container, Typography, Paper, Button, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Card, CardContent } from '@mui/material';
import { DeleteForever, Email, CheckCircle, Info, Schedule, ContentCopy } from '@mui/icons-material';
import Navbar from '../components/Navbar';

export default function AccountDeletion() {
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">{/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
          <DeleteForever sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Eliminación de Cuenta
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            Solicitud de Eliminación de Datos
          </Typography>
        </Box>

        {/* Importante */}
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Esta acción es permanente e irreversible
          </Typography>
          <Typography variant="body2">
            Una vez procesada tu solicitud, no podremos recuperar tu cuenta ni tus datos. Por favor, lee cuidadosamente la información antes de proceder.
          </Typography>
        </Alert>

        {/* Qué se Elimina */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <DeleteForever sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Datos que se eliminarán permanentemente
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Al eliminar tu cuenta de Elepad, se borrarán de forma permanente los siguientes datos:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Información de tu Cuenta"
                secondary="Nombre, email, fecha de nacimiento, foto de perfil y credenciales de autenticación."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Progreso en Juegos Cognitivos"
                secondary="Todas tus puntuaciones, logros, rachas y estadísticas de juegos (Memoria, Sudoku, NET, Focus)."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Recuerdos y Memorias Personales"
                secondary="Todas las fotos, álbumes, notas y recuerdos que hayas creado."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Eventos y Calendario"
                secondary="Todos los eventos familiares, actividades programadas y sincronizaciones con Google Calendar."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Membresía en Grupos Familiares"
                secondary="Serás removido de todos los grupos familiares. El contenido compartido por otros miembros permanecerá visible para ellos."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Historial de Actividades"
                secondary="Todo tu historial de uso de la aplicación y métricas de comportamiento."
              />
            </ListItem>
          </List>
        </Paper>

        {/* Qué se Conserva */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Info sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Datos que se conservan (Temporalmente)
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Por razones legales, técnicas y de seguridad, algunos datos se conservan por un periodo limitado:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Registros de actividad del sistema (30 días)"
                secondary="Logs técnicos necesarios para seguridad, detección de fraudes y depuración de errores. No contienen información personal identificable."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Copias de seguridad (30 días)"
                secondary="Las copias de seguridad automáticas se purgan completamente después de 30 días de la eliminación de tu cuenta."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Contenido compartido en Grupos Familiares"
                secondary="Los recuerdos y fotos que compartiste con tu grupo familiar permanecerán visibles para los demás miembros, pero se eliminará tu identificación como autor."
              />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Nota:</strong> Después de los periodos de retención indicados, todos los datos restantes se eliminan de forma permanente e irrecuperable de nuestros sistemas.
            </Typography>
          </Alert>
        </Paper>

        {/* Proceso de Eliminación */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Proceso de Eliminación de Cuenta
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Sigue estos pasos para solicitar la eliminación de tu cuenta de Elepad:
          </Typography>
          
          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 1: Haz una copia de tus datos (Opcional)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Antes de eliminar tu cuenta, puedes exportar tus datos desde la app:<br />
                <strong>Perfil → Configuración → Privacidad → Descargar mis datos</strong><br />
                Recibirás un archivo con todos tus recuerdos, fotos y estadísticas.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 2: Envía tu solicitud
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Envía un correo electrónico desde la cuenta registrada en Elepad a:
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
                <strong>Asunto del correo:</strong> "Solicitud de Eliminación de Cuenta - Elepad"<br />
                <strong>Incluye en el mensaje:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="• Tu nombre completo registrado en la app" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="• El email de tu cuenta de Elepad" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="• Confirmación de que entiendes que esta acción es irreversible" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="• Motivo de la eliminación (opcional, nos ayuda a mejorar)" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 3: Verificación de identidad
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Por seguridad, verificaremos tu identidad. Recibirás un código de confirmación por email que deberás responder. Esto nos asegura de que eres el titular legítimo de la cuenta.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 4: Periodo de reflexión (7 días)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Después de confirmar tu identidad, tu cuenta entrará en un periodo de "eliminación pendiente" de <strong>7 días calendario</strong>. Durante este tiempo:
              </Typography>
              <List dense>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="✓ Podrás cancelar la solicitud si cambias de opinión" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="✓ Tu cuenta estará desactivada pero tus datos intactos" />
                </ListItem>
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="✓ No podrás acceder a la aplicación" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                Paso 5: Eliminación permanente
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Después de 7 días, si no cancelas la solicitud, tu cuenta y todos los datos asociados se eliminarán de forma <strong>permanente e irreversible</strong>. Recibirás un email de confirmación final cuando el proceso se haya completado.
              </Typography>
            </CardContent>
          </Card>
        </Paper>


        {/* Contacto */}
        <Paper sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'primary.main', color: 'white', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            ¿Necesitas ayuda?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            Si tienes preguntas sobre el proceso de eliminación de cuenta o necesitas asistencia, no dudes en contactarnos:
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
            Enviar Solicitud de Eliminación
          </Button>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
