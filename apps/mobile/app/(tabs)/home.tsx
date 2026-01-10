import {
  StatusBar,
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Image,
  ImageBackground,
  Dimensions,
} from "react-native";
import {
  ActivityIndicator,
  Text,
  Avatar,
  Button,
  Chip,
  IconButton,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { LoadingProfile } from "@/components/shared";
import {
  useGetActivitiesFamilyCodeIdFamilyGroup,
  useGetAttempts,
  useGetMemories,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200,
} from "@elepad/api-client";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import StreakCounter from "@/components/StreakCounter";
import HighlightedMentionText from "@/components/Recuerdos/HighlightedMentionText";
import { useNotifications } from "@/hooks/useNotifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const { userElepad, userElepadLoading } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  // Fetch today's activities
  const activitiesQuery = useGetActivitiesFamilyCodeIdFamilyGroup(
    userElepad?.groupId || "",
    {
      query: {
        enabled: !!userElepad?.groupId,
      },
    },
  );

  // Fetch recent attempts
  const attemptsQuery = useGetAttempts(
    { limit: 1 },
    {
      query: {
        enabled: !!userElepad,
      },
    },
  );

  // Fetch recent memories
  const memoriesQuery = useGetMemories(
    userElepad?.groupId
      ? { limit: 1, groupId: userElepad.groupId }
      : { limit: 1 },
    {
      query: {
        enabled: !!userElepad,
      },
    },
  );

  // Fetch family members
  const membersQuery = useGetFamilyGroupIdGroupMembers(
    userElepad?.groupId || "",
    {
      query: {
        enabled: !!userElepad?.groupId,
      },
    },
  );

  const selectGroupInfo = (): GetFamilyGroupIdGroupMembers200 | undefined => {
    const resp = membersQuery.data as
      | { data?: GetFamilyGroupIdGroupMembers200 }
      | GetFamilyGroupIdGroupMembers200
      | undefined;
    if (!resp) return undefined;
    return (
      (resp as { data?: GetFamilyGroupIdGroupMembers200 }).data ??
      (resp as GetFamilyGroupIdGroupMembers200)
    );
  };

  const groupInfo = selectGroupInfo();
  const groupMembers = useMemo(() => {
    if (!groupInfo) return [] as Array<{ id: string; displayName: string; avatarUrl?: string | null }>;

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<string, { id: string; displayName: string; avatarUrl?: string | null }>();
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, { id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl ?? null });
    }
    return Array.from(byId.values());
  }, [groupInfo]);

  const upcomingActivities = useMemo(() => {
    if (!activitiesQuery.data) return [];
    const now = new Date();

    const activities = Array.isArray(activitiesQuery.data)
      ? activitiesQuery.data
      : activitiesQuery.data.data || [];

    return activities
      .filter((activity: any) => new Date(activity.startsAt) >= now)
      .sort(
        (a: any, b: any) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 3);
  }, [activitiesQuery.data]);

  const lastAttempt = useMemo(() => {
    if (!attemptsQuery.data) return null;
    const attempts = Array.isArray(attemptsQuery.data)
      ? attemptsQuery.data
      : attemptsQuery.data.data || [];
    return attempts[0] || null;
  }, [attemptsQuery.data]);

  const lastMemory = useMemo(() => {
    if (!memoriesQuery.data) return null;
    const memories = Array.isArray(memoriesQuery.data)
      ? memoriesQuery.data
      : memoriesQuery.data.data || [];
    return memories[0] || null;
  }, [memoriesQuery.data]);

  if (userElepadLoading || !userElepad) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <LoadingProfile message="Cargando inicio..." />
      </SafeAreaView>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";
  
  const userRole = userElepad?.elder ? "Adulto mayor" : "Ayudante";
  const displayNameWithRole = `${displayName} (${userRole})`;

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                ({userRole})
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Notification Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.notificationContainer,
                pressed && { opacity: 0.6 }
              ]}
              onPress={() => {
                router.push("/notifications");
              }}
              android_ripple={{ color: COLORS.primary + "30", borderless: true, radius: 24 }}
            >
              <IconButton
                icon="bell-outline"
                size={26}
                iconColor={COLORS.primary}
                style={styles.notificationButton}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            {/* Avatar */}
            {userElepad?.avatarUrl ? (
              <Avatar.Image
                size={55}
                source={{ uri: userElepad?.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={55}
                label={getInitials(displayName)}
                style={[styles.avatar, { backgroundColor: COLORS.primary }]}
                labelStyle={{ color: COLORS.white, fontSize: 22 }}
              />
            )}
          </View>
        </View>

        {/* Último Recuerdo - DESTACADO */}
        {memoriesQuery.isLoading ? (
          <View style={styles.memoryCardLoading}>
            <ActivityIndicator size="large" />
          </View>
        ) : lastMemory ? (
          <Pressable
            style={styles.memoryCard}
            onPress={() => router.push("/(tabs)/recuerdos")}
          >
            {lastMemory.mediaUrl && 
             lastMemory.mimeType && 
             (lastMemory.mimeType.startsWith("image/") || lastMemory.mimeType.startsWith("video/")) ? (
              <ImageBackground
                source={{ uri: lastMemory.mediaUrl }}
                style={styles.memoryImage}
                imageStyle={styles.memoryImageStyle}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.memoryGradient}
                >
                  <View style={styles.memoryContent}>
                    <Text style={styles.memoryLabel}>ÚLTIMO RECUERDO</Text>
                    <Text style={styles.memoryTitle} numberOfLines={2}>
                      {lastMemory.title || "Sin título"}
                    </Text>
                    {lastMemory.caption && (
                      <HighlightedMentionText
                        text={lastMemory.caption}
                        familyMembers={groupMembers}
                        style={styles.memoryDescription}
                      />
                    )}
                    <Text style={styles.memoryDate}>
                      {new Date(lastMemory.createdAt).toLocaleDateString("es", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            ) : (
              <View style={styles.memoryNoImage}>
                <View style={styles.memoryNoImageIcon}>
                  <IconButton icon="heart" size={40} iconColor={COLORS.primary} />
                </View>
                <View style={styles.memoryContent}>
                  <Text style={styles.memoryLabelDark}>ÚLTIMO RECUERDO</Text>
                  <Text style={styles.memoryTitleDark} numberOfLines={2}>
                    {lastMemory.title || "Sin título"}
                  </Text>

                  {lastMemory.caption && (
                    <HighlightedMentionText
                      text={lastMemory.caption}
                      familyMembers={groupMembers}
                      style={styles.memoryDescriptionDark}
                    />
                  )}
                  <Text style={styles.memoryDateDark}>
                    {new Date(lastMemory.createdAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.memoryCardEmpty}>
            <IconButton icon="heart-outline" size={48} iconColor={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No hay recuerdos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Comienza a crear tus momentos especiales
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/(tabs)/recuerdos")}
              style={styles.emptyButton}
              buttonColor={COLORS.primary}
            >
              Crear recuerdo
            </Button>
          </View>
        )}

        {/* Contador de Racha - Solo para usuarios elder */}
        {userElepad?.elder && <StreakCounter />}

        {/* Próximos Eventos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos eventos</Text>
            {upcomingActivities.length > 0 && (
              <Button
                mode="text"
                onPress={() => router.push("/calendar")}
                labelStyle={styles.sectionLink}
                compact
              >
                Ver todos
              </Button>
            )}
          </View>

          {activitiesQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) : upcomingActivities.length > 0 ? (
            <View style={styles.eventsContainer}>
              {upcomingActivities.map((activity: any) => {
                const activityDate = new Date(activity.startsAt);
                const isToday =
                  activityDate.toDateString() === new Date().toDateString();
                const isTomorrow =
                  activityDate.toDateString() ===
                  new Date(Date.now() + 86400000).toDateString();

                let dateLabel = activityDate.toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                });

                if (isToday) dateLabel = "Hoy";
                if (isTomorrow) dateLabel = "Mañana";

                return (
                  <View key={activity.id} style={styles.eventItem}>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventDate}>{dateLabel}</Text>
                      <Text style={styles.eventHour}>
                        {activityDate.toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={styles.eventDivider} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {activity.title}
                      </Text>
                      {activity.description && (
                        <HighlightedMentionText
                          text={activity.description}
                          groupMembers={groupMembers}
                          style={styles.eventDesc}
                          numberOfLines={1}
                        />
                      )}
                    </View>
                    {activity.completed && (
                      <Chip mode="flat" style={styles.eventChip} textStyle={styles.eventChipText}>
                        ✓
                      </Chip>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No hay eventos próximos</Text>
              <Button
                mode="outlined"
                onPress={() => router.push("/calendar")}
                style={styles.emptyButtonOutline}
                labelStyle={{ color: COLORS.primary }}
              >
                Crear evento
              </Button>
            </View>
          )}
        </View>

        {/* Actividad Reciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>

          {attemptsQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) : lastAttempt ? (
            <Pressable style={styles.gameCard} onPress={() => router.push("/history")}>
              <View style={styles.gameIcon}>
                <Text style={styles.gameEmoji}>
                  {lastAttempt.gameType === "memory" ? "🧠" : "🧩"}
                </Text>
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>
                  {lastAttempt.gameType === "memory" ? "Juego de Memoria" : "Juego NET"}
                </Text>
                <Text style={styles.gameTime}>
                  {new Date(lastAttempt.createdAt).toLocaleDateString("es", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.gameScore}>
                <Text style={styles.scoreLabel}>PUNTOS</Text>
                <Text style={styles.scoreValue}>{lastAttempt.score || 0}</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Aún no has jugado</Text>
              <Button
                mode="outlined"
                onPress={() => router.push("/games")}
                style={styles.emptyButtonOutline}
                labelStyle={{ color: COLORS.primary }}
              >
                Explorar juegos
              </Button>
            </View>
          )}
        </View>

        {/* Espacio inferior para que el contenido no quede debajo del menú */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  userName: {
    fontSize: 25,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  userNameContainer: {
    flexDirection: "column",
    flex: 1,
    alignItems: "flex-start",
  },
  userRole: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textLight,
    letterSpacing: 0,
    marginTop: -2,
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationContainer: {
    position: "relative",
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationButton: {
    margin: 0,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  avatar: {
    ...SHADOWS.card,
  },
  
  // Memory Card - DESTACADO
  memoryCard: {
    width: SCREEN_WIDTH,
    height: 280,
    marginBottom: 24,
  },
  memoryCardLoading: {
    width: SCREEN_WIDTH,
    height: 280,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
  },
  memoryCardEmpty: {
    width: SCREEN_WIDTH,
    height: 280,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 32,
  },
  memoryImage: {
    width: "100%",
    height: "100%",
  },
  memoryImageStyle: {
    resizeMode: "cover",
  },
  memoryGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
  },
  memoryNoImage: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    padding: 24,
    justifyContent: "flex-end",
  },
  memoryNoImageIcon: {
    position: "absolute",
    top: 24,
    right: 24,
    opacity: 0.3,
  },
  memoryContent: {
    gap: 6,
  },
  memoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  memoryLabelDark: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  memoryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    lineHeight: 30,
  },
  memoryTitleDark: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    lineHeight: 30,
  },
  memoryDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
  },
  memoryDescriptionDark: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  memoryDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 4,
  },
  memoryDateDark: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  sectionLink: {
    fontSize: 14,
    color: COLORS.primary,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  // Events
  eventsContainer: {
    gap: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  eventTime: {
    alignItems: "center",
    minWidth: 70,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 3,
  },
  eventHour: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  eventDivider: {
    width: 3,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.3,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  eventChip: {
    backgroundColor: COLORS.success,
    height: 32,
  },
  eventChipText: {
    fontSize: 16,
    color: COLORS.white,
  },

  // Game Card
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    gap: 16,
    ...SHADOWS.card,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  gameEmoji: {
    fontSize: 32,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  gameScore: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 70,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
  },

  // Empty States
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  emptyButtonOutline: {
    borderRadius: 12,
    borderColor: COLORS.primary,
  },
});
