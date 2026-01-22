import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import { Psychology, EmojiEvents, Groups, CalendarMonth } from '@mui/icons-material';

const features = [
  {
    icon: <Psychology sx={{ fontSize: 48 }} />,
    title: 'Juegos Cognitivos',
    description:
      'Ejercita la mente con juegos diseñados específicamente para estimular la memoria y el pensamiento.',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 48 }} />,
    title: 'Logros y Rachas',
    description:
      'Mantén tu motivación con un sistema de logros y rachas que premia tu constancia.',
  },
  {
    icon: <Groups sx={{ fontSize: 48 }} />,
    title: 'Conexión Familiar',
    description:
      'Comparte momentos especiales con tus seres queridos y fortalece los lazos familiares.',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 48 }} />,
    title: 'Recuerdos y Eventos',
    description:
      'Guarda tus memorias más preciadas y planifica eventos familiares importantes.',
  },
];

export default function Features() {
  return (
    <Box
      id="features"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              fontWeight: 700,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Todo lo que necesitas en{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              un solo lugar
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Elepad combina entretenimiento, salud cognitiva y conexión familiar
            en una experiencia única.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
            },
            gap: 4,
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 32px rgba(154, 158, 206, 0.15)',
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '16px',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    mb: 3,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
