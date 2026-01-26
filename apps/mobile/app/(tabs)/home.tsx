import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import {
  StatusBar,
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  ImageBackground,
  Dimensions,
  Image,
} from "react-native";
import { Text, Avatar, Button, IconButton } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "@/styles/base";
import { LoadingProfile, SkeletonBox } from "@/components/shared";
import {
  useGetActivitiesFamilyCodeIdFamilyGroup,
  useGetAttempts,
  useGetMemories,
  useGetFamilyGroupIdGroupMembers,
  GetFamilyGroupIdGroupMembers200,
  AttemptWithUser,
} from "@elepad/api-client";
import { useRouter } from "expo-router";
import { useMemo, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import StreakCounter from "@/components/StreakCounter";
import HighlightedMentionText from "@/components/Recuerdos/HighlightedMentionText";
import { useNotifications } from "@/hooks/useNotifications";
import { GAMES_INFO } from "@/constants/gamesInfo";
import { formatInUserTimezone, toUserLocalTime } from "@/lib/timezoneHelpers";
import type { ImageSourcePropType } from "react-native";
import memoryImage from "@/assets/images/memory2.png";
import netImage from "@/assets/images/net2.png";
import sudokuImage from "@/assets/images/sudoku2.png";
import focusImage from "@/assets/images/focus2.png";

// Onboarding imports
import { TourGuideZone } from "rn-tourguide";
import { useHomeTour } from "@/hooks/useHomeTour";


const GAME_IMAGES: Record<string, ImageSourcePropType> = {
  memory: memoryImage,
  logic: netImage,
  sudoku: sudokuImage,
  focus: focusImage,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper para obtener info del juego
const getGameInfo = (gameType: string) => {
  const gameMap: Record<string, { name: string; emoji: string }> = {
    memory: { name: GAMES_INFO.memory?.title || "Memoria", emoji: "🧠" },
    logic: { name: GAMES_INFO.net?.title || "NET", emoji: "🧩" },
    sudoku: { name: GAMES_INFO.sudoku?.title || "Sudoku", emoji: "🔢" },
    focus: { name: GAMES_INFO.focus?.title || "Focus", emoji: "🎯" },
  };
  return gameMap[gameType] || { name: "Juego", emoji: "🎮" };
};

export default function HomeScreen() {
  const { userElepad, userElepadLoading } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();

  // Tour Guide
  const { restartTour } = useHomeTour();
  const [debugTaps, setDebugTaps] = useState(0);

  // Fetch today's activities
  const activitiesQuery = useGetActivitiesFamilyCodeIdFamilyGroup(
    userElepad?.groupId || "",
    {
      query: {
        enabled: !!userElepad?.groupId,
      },
    },
  );

  // Calculate date range for last 24 hours (memoized to avoid constant recalculation)
  const dateRange = useMemo(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start: twentyFourHoursAgo.toISOString(),
      end: now.toISOString(),
    };
  }, []); // Empty deps - solo calcular una vez al montar

  // Fetch recent attempts
  // - Si es elder: su último intento personal
  // - Si es familiar: últimos intentos de elder del grupo en las últimas 24h
  const attemptsQuery = useGetAttempts(
    userElepad?.elder
      ? { limit: 1 }
      : {
        limit: 10,
        elderOnly: true,
        startDate: dateRange.start,
        endDate: dateRange.end,
      },
    {
      query: {
        enabled: !!userElepad,
        staleTime: 60000,
      },
    },
  );

  // Fetch recent memories
  const memoriesQuery = useGetMemories(
    { limit: 1, groupId: userElepad?.groupId || "" },
    {
      query: {
        enabled: !!userElepad?.groupId,
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
    if (!groupInfo)
      return [] as Array<{
        id: string;
        displayName: string;
        avatarUrl?: string | null;
      }>;

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<
      string,
      { id: string; displayName: string; avatarUrl?: string | null }
    >();
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, {
        id: m.id,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl ?? null,
      });
    }
    return Array.from(byId.values());
  }, [groupInfo]);

  const upcomingActivities = useMemo(() => {
    if (!activitiesQuery.data) return [];
    const now = new Date();

    const data = activitiesQuery.data;
    const activities = Array.isArray(data)
      ? data
      : (data as { data?: unknown }).data || [];

    if (!Array.isArray(activities)) return [];

    interface Activity {
      id: string;
      startsAt: string;
    }

    return activities
      .filter((activity: Activity) => new Date(activity.startsAt) >= now)
      .sort(
        (a: Activity, b: Activity) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 3);
  }, [activitiesQuery.data]);

  const lastAttempt = useMemo((): AttemptWithUser | AttemptWithUser[] | null => {
    if (!attemptsQuery.data) return null;
    const data = attemptsQuery.data;
    const attempts = Array.isArray(data)
      ? data
      : (data as { data?: unknown }).data || [];
    if (!Array.isArray(attempts)) return [];
    return userElepad?.elder ? attempts[0] || null : attempts;
  }, [attemptsQuery.data, userElepad?.elder]);

  const lastMemory = useMemo(() => {
    if (!memoriesQuery.data) return null;
    const data = memoriesQuery.data;
    const memories = Array.isArray(data)
      ? data
      : (data as { data?: unknown }).data || [];
    if (!Array.isArray(memories)) return null;
    return memories[0] || null;
  }, [memoriesQuery.data]);

  // Invalidar queries cuando cambia el groupId
  useEffect(() => {
    if (userElepad?.groupId) {
      // Invalidar las queries relacionadas con el grupo para forzar refetch
      queryClient.invalidateQueries({ queryKey: ["getMemories"] });
      queryClient.invalidateQueries({
        queryKey: ["getActivitiesFamilyCodeIdFamilyGroup"],
      });
      queryClient.invalidateQueries({
        queryKey: ["getFamilyGroupIdGroupMembers"],
      });
    }
  }, [userElepad?.groupId, queryClient]);

  if (userElepadLoading || !userElepad) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <LoadingProfile />
      </SafeAreaView>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";

  const userRole = userElepad?.elder ? "Adulto Mayor" : "Familiar";

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
            <TourGuideZone
              zone={1}
              text="¡Hola! Aquí verás tu saludo y rol dentro de la familia Elepad."
              borderRadius={8}
              shape="rectangle"
            >
              <View>
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
            </TourGuideZone>
          </View>
          <View style={styles.headerRight}>
            {/* Notification Button */}
            <TourGuideZone
              zone={3}
              text="Aquí te avisaremos de nuevas actividades, recuerdos compartidos y más."
              shape="circle"
            >
              <Pressable
                style={({ pressed }) => [
                  styles.notificationContainer,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => {
                  router.push("/notifications");
                }}
                android_ripple={{
                  color: COLORS.primary + "30",
                  borderless: true,
                  radius: 24,
                }}
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
              {/* End Wrap Notification */}
            </TourGuideZone>

            {/* Avatar */}
            {/* Avatar with Frame */}
            <TourGuideZone
              zone={2}
              text="Desde aquí puedes ver y editar tu perfil o configurar la aplicación."
              borderRadius={30}
              shape="circle"
              style={{ marginLeft: 8 }}
            >
              <Pressable
                onPress={() => {
                  router.navigate({
                    pathname: "/(tabs)/home",
                    params: {
                      tab: "configuracion",
                    },
                  });
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ position: "relative" }}>
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
                  {userElepad?.activeFrameUrl && (
                    <Image
                      source={{ uri: userElepad?.activeFrameUrl }}
                      style={{
                        position: "absolute",
                        width: 55 * 1.4,
                        height: 55 * 1.4,
                        top: -55 * 0.2,
                        left: -55 * 0.2,
                        zIndex: 10,
                      }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </Pressable>
            </TourGuideZone>
          </View>
        </View>

        {/* Último Recuerdo - DESTACADO */}
        <TourGuideZone
          zone={4}
          text="Revive tus momentos especiales. Aquí aparecerá tu recuerdo más reciente."
          borderRadius={20}
        >
          <View>
            {memoriesQuery.isLoading ? (
              <View style={styles.memoryCardLoading}>
                <SkeletonBox width={SCREEN_WIDTH} height={280} borderRadius={0} />
              </View>
            ) : lastMemory ? (
              <Animated.View entering={FadeIn.duration(800)}>
                <Pressable
                  style={styles.memoryCard}
                  onPress={() =>
                    router.navigate({
                      pathname: "/(tabs)/recuerdos",
                      params: {
                        tab: "recuerdos",
                        memoryId: lastMemory.id,
                        bookId: lastMemory.bookId,
                      },
                    })
                  }
                >
                  {lastMemory.mediaUrl &&
                    lastMemory.mimeType &&
                    (lastMemory.mimeType.startsWith("image/") ||
                      lastMemory.mimeType.startsWith("video/")) ? (
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
                            {formatInUserTimezone(
                              lastMemory.createdAt,
                              "d 'de' MMMM 'de' yyyy",
                              userElepad?.timezone
                            )}
                          </Text>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  ) : (
                    <View style={styles.memoryNoImage}>
                      <View style={styles.memoryNoImageIcon}>
                        <IconButton
                          icon="heart"
                          size={40}
                          iconColor={COLORS.primary}
                        />
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
                          {formatInUserTimezone(
                            lastMemory.createdAt,
                            "d 'de' MMMM 'de' yyyy",
                            userElepad?.timezone
                          )}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable
                style={styles.memoryCardEmpty}
                onPress={() => router.push("/(tabs)/recuerdos")}
              >
                <IconButton
                  icon="heart-outline"
                  size={48}
                  iconColor={COLORS.textSecondary}
                />
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
              </Pressable>

            )}
          </View>
        </TourGuideZone>

        {/* Contador de Racha - Solo para usuarios elder */}
        {userElepad?.elder && <StreakCounter />}

        {/* Próximos Eventos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Próximos{" "}
              <Text
                onPress={() => {
                  const newTaps = debugTaps + 1;
                  setDebugTaps(newTaps);
                  if (newTaps >= 10) {
                    setDebugTaps(0);
                    restartTour();
                  }
                }}
                suppressHighlighting={true}
              >
                eventos
              </Text>
            </Text>
            {upcomingActivities.length > 0 && (
              <Button
                mode="text"
                onPress={() => {
                  router.navigate({
                    pathname: "/(tabs)/home",
                    params: {
                      tab: "calendar",
                    },
                  });
                }}
                labelStyle={styles.sectionLink}
                compact
              >
                Ver todos
              </Button>
            )}
          </View>

          <>
            {activitiesQuery.isLoading ? (
              <View style={[styles.eventsContainer, { marginTop: 0 }]}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.eventItem}>
                    <View style={styles.eventTime}>
                      <SkeletonBox
                        width={60}
                        height={16}
                        borderRadius={4}
                        style={{ marginBottom: 8 }}
                      />
                      <SkeletonBox width={50} height={14} borderRadius={4} />
                    </View>
                    <View style={styles.eventDivider} />
                    <View style={styles.eventContent}>
                      <SkeletonBox
                        width="80%"
                        height={18}
                        borderRadius={4}
                        style={{ marginBottom: 8 }}
                      />
                      <SkeletonBox width="60%" height={14} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : upcomingActivities.length > 0 ? (
              <View style={[styles.eventsContainer, { marginTop: 0 }]}>
                {upcomingActivities.map(
                  (
                    activity: {
                      id: string;
                      startsAt: string;
                      title: string;
                      description?: string;
                    },
                    index,
                  ) => {
                    const activityDate = toUserLocalTime(activity.startsAt, userElepad?.timezone);
                    const now = toUserLocalTime(new Date(), userElepad?.timezone);
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const isToday =
                      activityDate.toDateString() === now.toDateString();
                    const isTomorrow =
                      activityDate.toDateString() === tomorrow.toDateString();

                    let dateLabel = formatInUserTimezone(
                      activity.startsAt,
                      "d MMM",
                      userElepad?.timezone
                    );

                    if (isToday) dateLabel = "Hoy";
                    if (isTomorrow) dateLabel = "Mañana";

                    return (
                      <Pressable
                        key={activity.id}
                        onPress={() => {
                          console.log(
                            "🏠 Home: Navigating to calendar with activity",
                            {
                              activityId: activity.id,
                              title: activity.title,
                              startsAt: activity.startsAt,
                            },
                          );
                          // Navegar al tab de calendario y abrir el detalle del evento
                          router.navigate({
                            pathname: "/(tabs)/home",
                            params: {
                              tab: "calendar",
                              activityId: activity.id,
                            },
                          });
                        }}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Animated.View
                          entering={ZoomIn.duration(200).delay(index * 50)}
                          style={styles.eventItem}
                        >
                          <View style={styles.eventTime}>
                            <Text style={styles.eventDate}>{dateLabel}</Text>
                            <Text style={styles.eventHour}>
                              {formatInUserTimezone(
                                activity.startsAt,
                                "HH:mm",
                                userElepad?.timezone
                              )}
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
                        </Animated.View>
                      </Pressable>
                    );
                  },
                )}
              </View>
            ) : (
              <View style={[styles.emptySection, { marginTop: 0 }]}>
                <Text style={styles.emptyText}> No hay eventos próximos </Text>
                <Button
                  mode="outlined"
                  onPress={() => {
                    router.navigate({
                      pathname: "/(tabs)/home",
                      params: {
                        tab: "calendar",
                        openForm: "true",
                      },
                    });
                  }}
                  style={styles.emptyButtonOutline}
                  textColor={COLORS.primary}
                  icon="calendar-plus"
                >
                  Crear evento
                </Button>
              </View>
            )}
          </>
        </View>

        {/* Actividad Reciente */}
        <TourGuideZone
          zone={5}
          text="Mantente al día con los juegos y actividades cognitivas completadas."
          borderRadius={16}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {userElepad?.elder ? "Mi última actividad" : "Última actividad del grupo"}
            </Text>

            {attemptsQuery.isLoading ? (
              <View style={[styles.gameCard, { marginTop: 10 }]}>
                <SkeletonBox width={60} height={60} borderRadius={30} />
                <View style={{ flex: 1, justifyContent: "center", gap: 8 }}>
                  <SkeletonBox width="70%" height={18} borderRadius={4} />
                  <SkeletonBox width="50%" height={14} borderRadius={4} />
                </View>
                <SkeletonBox width={70} height={60} borderRadius={14} />
              </View>
            ) : userElepad?.elder ? (
              // Elder: mostrar solo su último intento
              lastAttempt && !Array.isArray(lastAttempt) ? (
                <Pressable
                  style={styles.gameCard}
                  onPress={() => router.push("/history")}
                >
                  <View style={styles.gameIcon}>
                    <Image
                      source={GAME_IMAGES[lastAttempt.gameType || "memory"]}
                      style={{ width: 40, height: 40, resizeMode: "contain" }}
                    />
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameName}>
                      {getGameInfo(lastAttempt.gameType || "").name}
                    </Text>
                    <Text style={styles.gameTime}>
                      {formatInUserTimezone(
                        lastAttempt.startedAt,
                        "d 'de' MMMM, HH:mm",
                        userElepad?.timezone
                      )}
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
                    onPress={() => router.push("/juegos")}
                    style={styles.emptyButtonOutline}
                    labelStyle={{ color: COLORS.primary }}
                  >
                    Explorar juegos
                  </Button>
                </View>
              )
            ) : (
              // Familiar: mostrar múltiples intentos de elder
              Array.isArray(lastAttempt) && lastAttempt.length > 0 ? (
                <View style={{ gap: 10, marginTop: 10 }}>
                  {lastAttempt.map((attempt: AttemptWithUser) => (
                    <Pressable
                      key={attempt.id}
                      style={styles.gameCard}
                      onPress={() => router.push("/history")}
                    >
                      <View style={styles.gameIcon}>
                        <Image
                          source={GAME_IMAGES[attempt.gameType || "memory"]}
                          style={{ width: 40, height: 40, resizeMode: "contain" }}
                        />
                      </View>
                      <View style={styles.gameInfo}>
                        <Text style={styles.gameName}>
                          {getGameInfo(attempt.gameType || "").name}
                        </Text>
                        <Text style={styles.gameTime}>
                          {formatInUserTimezone(
                            attempt.startedAt,
                            "d 'de' MMMM, HH:mm",
                            userElepad?.timezone
                          )}
                        </Text>
                        {attempt.user && (
                          <View style={styles.playerInfo}>
                            {attempt.user.avatarUrl ? (
                              <Avatar.Image
                                size={20}
                                source={{ uri: attempt.user.avatarUrl }}
                                style={styles.playerAvatar}
                              />
                            ) : (
                              <Avatar.Text
                                size={20}
                                label={attempt.user.displayName
                                  .substring(0, 2)
                                  .toUpperCase()}
                                style={styles.playerAvatar}
                              />
                            )}
                            <Text style={styles.playerName}>
                              {attempt.user.displayName}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.gameScore}>
                        <Text style={styles.scoreLabel}>PUNTOS</Text>
                        <Text style={styles.scoreValue}>{attempt.score || 0}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptyText}>No hay actividad reciente en el grupo</Text>
                  <Button
                    mode="outlined"
                    onPress={() => router.navigate({ pathname: "/(tabs)/home", params: { tab: "juegos" } })}
                    style={styles.emptyButtonOutline}
                    labelStyle={{ color: COLORS.primary }}
                  >
                    Ver estadísticas
                  </Button>
                </View>
              )
            )}
          </View>
        </TourGuideZone>


        {/* Espacio inferior para que el contenido no quede debajo del menú */}
        <View style={{ height: 100 }} />
      </ScrollView >
    </SafeAreaView >
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
    backgroundColor: COLORS.secondary,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 0,
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
    marginTop: 10,
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
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  playerAvatar: {
    marginRight: 0,
  },
  playerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
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
    paddingVertical: 20,
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
