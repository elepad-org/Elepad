import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import { Psychology, EmojiEvents, Groups, CalendarMonth } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: <Psychology sx={{ fontSize: 48 }} />,
    titleKey: 'features.cognitiveGames.title',
    descriptionKey: 'features.cognitiveGames.description',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 48 }} />,
    titleKey: 'features.achievementsStreaks.title',
    descriptionKey: 'features.achievementsStreaks.description',
  },
  {
    icon: <Groups sx={{ fontSize: 48 }} />,
    titleKey: 'features.familyConnection.title',
    descriptionKey: 'features.familyConnection.description',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 48 }} />,
    titleKey: 'features.memoriesEvents.title',
    descriptionKey: 'features.memoriesEvents.description',
  },
];

export default function Features() {
  const { t } = useTranslation();
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
            {t('features.title')}{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              {t('features.highlight')}
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
            {t('features.description')}
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
                  {t(feature.titleKey)}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  }}
                >
                  {t(feature.descriptionKey)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
