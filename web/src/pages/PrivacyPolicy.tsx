import { Box, Container, Typography, List, ListItem, ListItemText, ListItemIcon, Paper, Button } from '@mui/material';
import { Security, Email, Timer, Info, Camera, CalendarMonth, Notifications } from '@mui/icons-material';
import Navbar from '../components/Navbar';

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar variant="legal" />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'black' }}>
            Política de Privacidad
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Introducción */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Introducción
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            En Elepad, nos comprometemos a proteger la privacidad y seguridad de nuestros usuarios. Esta política describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra aplicación móvil.
          </Typography>
        </Paper>

        {/* Información que Recopilamos */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Security sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Información que Recopilamos
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            1. Información de Cuenta
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            • Nombre y apellidos<br />
            • Dirección de correo electrónico<br />
            • Foto de perfil (opcional)<br />
            • Fecha de nacimiento<br />
            • Información de autenticación (cuando usas Google OAuth)
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            2. Datos de uso de la Aplicación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            • Progreso y puntuaciones en juegos cognitivos (Memoria, Sudoku, NET, Focus)<br />
            • Logros y rachas de actividad<br />
            • Historial de juegos completados<br />
            • Frecuencia de uso de la aplicación
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            3. Contenido generado por el usuario
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            • Recuerdos y memorias compartidas<br />
            • Fotos y álbumes familiares<br />
            • Eventos y actividades del calendario<br />
            • Notas y descripciones personales
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            4. Datos del Grupo Familiar
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            • Información de miembros del grupo familiar (con su consentimiento)<br />
            • Relaciones familiares<br />
            • Contenido compartido dentro del grupo
          </Typography>
        </Paper>


        {/* Almacenamiento y Seguridad */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timer sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Almacenamiento y Seguridad de Datos
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Ubicación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            Tus datos se almacenan de forma segura en servidores de Supabase, que utiliza infraestructura de AWS con certificación SOC 2.
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Encriptación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            Toda la información se transmite mediante HTTPS/TLS y se almacena con encriptación en reposo.
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Periodo de retención
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'primary.main' }}>
            Mantenemos tus datos mientras tu cuenta esté activa. Si no usas la aplicación durante 2 años consecutivos, te contactaremos para confirmar si deseas mantener tu cuenta.
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            Copias de seguridad
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'primary.main' }}>
            Realizamos copias de seguridad automáticas que se conservan por 30 días para recuperación ante desastres.
          </Typography>
        </Paper>

       

        {/* Permisos de la Aplicación */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Permisos de la Aplicación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            Elepad solicita los siguientes permisos:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <Camera />
              </ListItemIcon>
              <ListItemText 
                primary="Cámara y Galería de Fotos"
                secondary="Para tomar fotos de perfil y añadir imágenes a tus recuerdos. Solo accedemos a las fotos que tú seleccionas."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <CalendarMonth />
              </ListItemIcon>
              <ListItemText 
                primary="Calendario (opcional)"
                secondary="Para sincronizar eventos familiares con Google Calendar. Puedes vincular o desvincular en cualquier momento."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                <Notifications />
              </ListItemIcon>
              <ListItemText 
                primary="Notificaciones"
                secondary="Para recordatorios de eventos, logros y celebraciones de rachas. Puedes desactivarlas en cualquier momento."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Cambios en la Política */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Cambios en esta Política
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos mediante un aviso en la aplicación o por correo electrónico. Te recomendamos revisar esta política periódicamente.
          </Typography>
        </Paper>

        {/* Contacto */}
        <Paper sx={{ p: 1.5, borderRadius: 3, backgroundColor: 'primary.main', color: 'white', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Email sx={{ mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ¿Preguntas o Inquietudes?
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            Si tienes alguna pregunta sobre esta política de privacidad o sobre cómo manejamos tus datos, no dudes en contactarnos:
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
            Enviar Consulta
          </Button>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
