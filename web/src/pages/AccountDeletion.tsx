import { Box, Container, Typography, Paper, Button, Alert, List, ListItem, ListItemIcon, ListItemText, Divider, Card, CardContent } from '@mui/material';
import { DeleteForever, Email, CheckCircle, Info, Schedule } from '@mui/icons-material';
import LegalNavbar from '../components/LegalNavbar';

export default function AccountDeletion() {
  return (
    <>
      <LegalNavbar />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
        <Container maxWidth="md">{/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
          <DeleteForever sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Eliminación de Cuenta
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            Elepad - Solicitud de Eliminación de Datos
          </Typography>
        </Box>

        {/* Importante */}
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            ⚠️ Esta acción es permanente e irreversible
          </Typography>
          <Typography variant="body2">
            Una vez procesada tu solicitud, no podremos recuperar tu cuenta ni tus datos. Por favor, lee cuidadosamente la información antes de proceder.
          </Typography>
        </Alert>

        {/* Qué se Elimina */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <DeleteForever sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Datos que se Eliminarán Permanentemente
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
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '2px solid', borderColor: 'info.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Info sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Datos que se Conservan (Temporalmente)
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
                primary="Registros de Actividad del Sistema (30 días)"
                secondary="Logs técnicos necesarios para seguridad, detección de fraudes y depuración de errores. No contienen información personal identificable."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Copias de Seguridad (30 días)"
                secondary="Las copias de seguridad automáticas se purgan completamente después de 30 días de la eliminación de tu cuenta."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Datos de Facturación (Si aplicable) (7 años)"
                secondary="Si tuvieras suscripciones de pago futuras, los registros de facturación se conservan por obligaciones fiscales y legales."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Contenido Compartido en Grupos Familiares"
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
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: 'background.paper' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Proceso de Eliminación de Cuenta
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Sigue estos pasos para solicitar la eliminación de tu cuenta de Elepad:
          </Typography>
          
          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 1: Haz una Copia de tus Datos (Opcional)
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
                Paso 2: Envía tu Solicitud
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Envía un correo electrónico desde la cuenta registrada en Elepad a:
              </Typography>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'primary.main', 
                color: 'white', 
                borderRadius: 2,
                textAlign: 'center',
                mb: 2
              }}>
                <Email sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  eliminar-cuenta@elepad.com
                </Typography>
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
                Paso 3: Verificación de Identidad
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Por seguridad, verificaremos tu identidad. Recibirás un código de confirmación por email que deberás responder. Esto nos asegura de que eres el titular legítimo de la cuenta.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Paso 4: Periodo de Reflexión (7 días)
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
                Paso 5: Eliminación Permanente
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Después de 7 días, si no cancelas la solicitud, tu cuenta y todos los datos asociados se eliminarán de forma <strong>permanente e irreversible</strong>. Recibirás un email de confirmación final cuando el proceso se haya completado.
              </Typography>
            </CardContent>
          </Card>
        </Paper>

        {/* Timeline Visual */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Línea de Tiempo del Proceso
          </Typography>
          <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Día 0 - Solicitud Recibida
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Envías el correo de solicitud de eliminación
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Día 0-1 - Verificación
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Verificamos tu identidad y te enviamos código de confirmación
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Días 1-7 - Periodo de Reflexión
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Cuenta desactivada, datos intactos, puedes cancelar la solicitud
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'error.main' }}>
                Día 7 - Eliminación Permanente
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tu cuenta y datos se eliminan de forma irreversible
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                Día 37 - Purga Completa
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Se eliminan copias de seguridad y logs técnicos (30 días adicionales)
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Alternativas */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: 'info.light' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            ¿Estás Seguro? Considera estas Alternativas
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            Si no estás completamente seguro de eliminar tu cuenta, considera estas opciones:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="📴 Desactivación Temporal"
                secondary="Puedes desactivar tu cuenta temporalmente sin perder tus datos. La reactivación es instantánea cuando quieras volver."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="🔕 Desactivar Notificaciones"
                secondary="Si las notificaciones te molestan, puedes desactivarlas completamente sin eliminar la cuenta."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="👥 Salir de Grupos Familiares"
                secondary="Puedes salir de grupos específicos sin eliminar toda tu cuenta y datos."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="🔒 Cambiar Configuración de Privacidad"
                secondary="Ajusta qué información compartes y con quién desde la configuración de privacidad."
              />
            </ListItem>
          </List>
        </Paper>

        {/* Contacto */}
        <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
          <Email sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            ¿Necesitas Ayuda?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
            Si tienes preguntas sobre el proceso de eliminación de cuenta o necesitas asistencia, no dudes en contactarnos:
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            href="mailto:eliminar-cuenta@elepad.com"
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
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
            📧 eliminar-cuenta@elepad.com<br />
            🌐 www.elepad.com/soporte
          </Typography>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
