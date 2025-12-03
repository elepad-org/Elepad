import {
  StatusBar,
  ScrollView,
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  ActivityIndicator,
  Text,
  Avatar,
  Card,
  Button,
  Chip,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import {
  useGetActivitiesFamilyCodeIdFamilyGroup,
  useGetAttempts,
  useGetMemories,
} from "@elepad/api-client";
import { useRouter } from "expo-router";
import { useMemo } from "react";

export default function HomeScreen() {
  const { userElepad, loading } = useAuth();
  const router = useRouter();

  // Fetch today's activities
  const activitiesQuery = useGetActivitiesFamilyCodeIdFamilyGroup(
    userElepad?.familyGroupId || "",
    {
      query: {
        enabled: !!userElepad?.familyGroupId,
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
    { limit: 1 },
    {
      query: {
        enabled: !!userElepad,
      },
    },
  );

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

  if (loading) {
    return (
      <SafeAreaView style={STYLES.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";

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
    <SafeAreaView style={STYLES.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Header compacto y elegante */}
          <View style={styles.compactHeader}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            {userElepad?.avatarUrl ? (
              <Avatar.Image
                size={56}
                source={{ uri: userElepad?.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={56}
                label={getInitials(displayName)}
                style={[styles.avatar, { backgroundColor: COLORS.primary }]}
                labelStyle={{ color: COLORS.white, fontSize: 20 }}
              />
            )}
          </View>

          {/* Widget: Próximos eventos */}
          <Card style={styles.widgetCard}>
            <Card.Content>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Próximos eventos</Text>
              </View>
              {activitiesQuery.isLoading ? (
                <ActivityIndicator size="small" style={{ marginTop: 12 }} />
              ) : upcomingActivities.length > 0 ? (
                <View style={styles.widgetContent}>
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
                      <View key={activity.id} style={styles.activityItem}>
                        <View style={styles.activityLeft}>
                          <Text style={styles.activityDate}>{dateLabel}</Text>
                          <Text style={styles.activityTime}>
                            {activityDate.toLocaleTimeString("es", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                        <View style={styles.activityDivider} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle} numberOfLines={1}>
                            {activity.title}
                          </Text>
                          {activity.description && (
                            <Text
                              style={styles.activityDescription}
                              numberOfLines={1}
                            >
                              {activity.description}
                            </Text>
                          )}
                        </View>
                        {activity.completed && (
                          <Chip
                            mode="flat"
                            style={styles.completedChip}
                            textStyle={styles.completedChipText}
                          >
                            ✓
                          </Chip>
                        )}
                      </View>
                    );
                  })}
                  <Button
                    mode="text"
                    onPress={() => router.push("/calendar")}
                    style={{ marginTop: 8 }}
                    labelStyle={{ color: COLORS.primary }}
                  >
                    Ver todos los eventos
                  </Button>
                </View>
              ) : (
                <View style={styles.emptyWidget}>
                  <Text style={styles.emptyText}>No hay eventos próximos</Text>
                  <Button
                    mode="contained"
                    onPress={() => router.push("/calendar")}
                    style={{ marginTop: 16, borderRadius: 12 }}
                    buttonColor={COLORS.primary}
                  >
                    Crear evento
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Widget: Último juego */}
          <Card style={styles.widgetCard}>
            <Card.Content>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Actividad reciente</Text>
              </View>
              {attemptsQuery.isLoading ? (
                <ActivityIndicator size="small" style={{ marginTop: 12 }} />
              ) : lastAttempt ? (
                <Pressable
                  style={styles.widgetContent}
                  onPress={() => router.push("/history")}
                >
                  <View style={styles.gameInfo}>
                    <View style={styles.gameHeader}>
                      <Text style={styles.gameIcon}>
                        {lastAttempt.gameType === "memory" ? "🧠" : "🧩"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gameName}>
                          {lastAttempt.gameType === "memory"
                            ? "Juego de Memoria"
                            : "Juego NET"}
                        </Text>
                        <Text style={styles.gameTime}>
                          {new Date(lastAttempt.createdAt).toLocaleDateString(
                            "es",
                            {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </Text>
                      </View>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Puntuación</Text>
                        <Text style={styles.scoreValue}>
                          {lastAttempt.score || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.emptyWidget}>
                  <Text style={styles.emptyText}>Aún no has jugado</Text>
                  <Button
                    mode="contained"
                    onPress={() => router.push("/games")}
                    style={{ marginTop: 16, borderRadius: 12 }}
                    buttonColor={COLORS.primary}
                  >
                    Explorar juegos
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Widget: Recuerdo reciente */}
          <Card style={styles.widgetCard}>
            <Card.Content>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Último recuerdo</Text>
              </View>
              {memoriesQuery.isLoading ? (
                <ActivityIndicator size="small" style={{ marginTop: 12 }} />
              ) : lastMemory ? (
                <Pressable
                  style={styles.widgetContent}
                  onPress={() => router.push("/(tabs)/memories")}
                >
                  <View style={styles.memoryInfo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memoryTitle} numberOfLines={2}>
                        {lastMemory.title || "Sin título"}
                      </Text>
                      {lastMemory.description && (
                        <Text
                          style={styles.memoryDescription}
                          numberOfLines={3}
                        >
                          {lastMemory.description}
                        </Text>
                      )}
                      <Text style={styles.memoryDate}>
                        {new Date(lastMemory.createdAt).toLocaleDateString(
                          "es",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.emptyWidget}>
                  <Text style={styles.emptyText}>
                    No hay recuerdos guardados
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => router.push("/(tabs)/memories")}
                    style={{ marginTop: 16, borderRadius: 12 }}
                    buttonColor={COLORS.primary}
                  >
                    Crear recuerdo
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
  },
  avatar: {
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  widgetCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
  },
  widgetContent: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    ...SHADOWS.light,
  },
  activityLeft: {
    alignItems: "center",
    minWidth: 70,
  },
  activityDate: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  activityDivider: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.primary + "30",
    borderRadius: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  completedChip: {
    backgroundColor: COLORS.success,
    height: 28,
  },
  completedChipText: {
    fontSize: 14,
    color: COLORS.white,
  },
  emptyWidget: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  gameInfo: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gameIcon: {
    fontSize: 40,
  },
  gameName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: "600",
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  memoryInfo: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  memoryDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  memoryDate: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
