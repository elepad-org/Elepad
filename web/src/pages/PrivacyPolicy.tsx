import { Box, Container, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { Security, Email, Timer, Info } from '@mui/icons-material';
import LegalNavbar from '../components/LegalNavbar';

export default function PrivacyPolicy() {
  return (
    <>
      <LegalNavbar />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            Política de Privacidad
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Elepad - Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Introducción */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
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
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
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
            2. Datos de Uso de la Aplicación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            • Progreso y puntuaciones en juegos cognitivos (Memoria, Sudoku, NET, Focus)<br />
            • Logros y rachas de actividad<br />
            • Historial de juegos completados<br />
            • Frecuencia de uso de la aplicación
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            3. Contenido Generado por el Usuario
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

        {/* Cómo Usamos la Información */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Cómo Usamos la Información
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Proporcionar y Mejorar Servicios"
                secondary="Utilizamos tus datos para ofrecer funcionalidades personalizadas, mejorar la experiencia de usuario y desarrollar nuevas características."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Juegos Cognitivos"
                secondary="Guardamos tu progreso y estadísticas para adaptar la dificultad de los juegos y proporcionar recomendaciones personalizadas."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Conexión Familiar"
                secondary="Facilitamos el intercambio de recuerdos, fotos y eventos entre miembros del grupo familiar."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Comunicación"
                secondary="Te enviamos notificaciones sobre logros, recordatorios de eventos y actualizaciones importantes (puedes desactivarlas en ajustes)."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Seguridad y Prevención de Fraudes"
                secondary="Protegemos tu cuenta y detectamos actividades sospechosas o no autorizadas."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Almacenamiento y Seguridad */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Timer sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Almacenamiento y Seguridad de Datos
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            <strong>Ubicación:</strong> Tus datos se almacenan de forma segura en servidores de Supabase, que utiliza infraestructura de AWS con certificación SOC 2.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            <strong>Encriptación:</strong> Toda la información se transmite mediante HTTPS/TLS y se almacena con encriptación en reposo.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            <strong>Periodo de Retención:</strong> Mantenemos tus datos mientras tu cuenta esté activa. Si no usas la aplicación durante 2 años consecutivos, te contactaremos para confirmar si deseas mantener tu cuenta.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            <strong>Copias de Seguridad:</strong> Realizamos copias de seguridad automáticas que se conservan por 30 días para recuperación ante desastres.
          </Typography>
        </Paper>

        {/* Compartir Información */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Compartir Información con Terceros
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            <strong>No vendemos tus datos personales.</strong> Solo compartimos información en estos casos específicos:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Proveedores de Servicios"
                secondary="Supabase (almacenamiento), Google (autenticación OAuth), Cloudflare (API). Todos tienen estrictos acuerdos de confidencialidad."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Grupo Familiar"
                secondary="El contenido que compartes en tu grupo familiar es visible para los miembros que hayas añadido."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Obligaciones Legales"
                secondary="Cuando sea requerido por ley o para proteger nuestros derechos legales."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Permisos de la Aplicación */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Permisos de la Aplicación
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            Elepad solicita los siguientes permisos:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="📸 Cámara y Galería de Fotos"
                secondary="Para tomar fotos de perfil y añadir imágenes a tus recuerdos. Solo accedemos a las fotos que tú seleccionas."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="📅 Calendario (opcional)"
                secondary="Para sincronizar eventos familiares con Google Calendar. Puedes vincular o desvincular en cualquier momento."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="🔔 Notificaciones"
                secondary="Para recordatorios de eventos, logros y celebraciones de rachas. Puedes desactivarlas en cualquier momento."
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Derechos del Usuario */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Tus Derechos
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }}>
            Tienes derecho a:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="✓ Acceder a todos tus datos personales" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Corregir información incorrecta o desactualizada" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Exportar tus datos en formato legible" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Eliminar tu cuenta y todos los datos asociados" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Retirar consentimientos otorgados previamente" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Oponerte al procesamiento de tus datos" />
            </ListItem>
          </List>
        </Paper>

        {/* Menores de Edad */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Protección de Menores
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            Elepad está diseñada para ser usada por personas de todas las edades. Para usuarios menores de 13 años, requerimos el consentimiento de un padre o tutor legal. No recopilamos intencionalmente información personal de menores sin consentimiento parental. Si descubres que un menor ha proporcionado información sin autorización, contáctanos inmediatamente.
          </Typography>
        </Paper>

        {/* Cambios en la Política */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Cambios en esta Política
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
            Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos mediante un aviso en la aplicación o por correo electrónico. Te recomendamos revisar esta política periódicamente.
          </Typography>
        </Paper>

        {/* Contacto */}
        <Paper sx={{ p: 4, borderRadius: 3, backgroundColor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Email sx={{ mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ¿Preguntas o Inquietudes?
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            Si tienes alguna pregunta sobre esta política de privacidad o sobre cómo manejamos tus datos, no dudes en contactarnos:
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
            📧 Email: privacidad@elepad.com<br />
            🌐 Web: www.elepad.com/contacto
          </Typography>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
