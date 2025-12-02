import React, { useState, useCallback, useEffect } from "react";
import { StatusBar, ScrollView, View, StyleSheet } from "react-native";
import {
  ActivityIndicator,
  Text,
  Card,
  Button,
  Chip,
  Divider,
  Portal,
  Dialog,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
<<<<<<< HEAD
import { COLORS, STYLES, SHADOWS, FONT } from "@/styles/base";
import { router, useLocalSearchParams, Stack } from "expo-router";
=======
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { router, useLocalSearchParams } from "expo-router";
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
import {
  useGetAchievementsUserGameType,
  GameType,
  getAttempts,
} from "@elepad/api-client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
<<<<<<< HEAD
=======
import { CustomHeader } from "@/components/shared/CustomHeader";
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
import { GAMES_INFO } from "@/constants/gamesInfo";
import { GameInstructions } from "@/components/shared/GameInstructions";

interface Achievement {
  id: string;
  icon?: string;
  title: string;
  description: string;
  points?: number;
}

interface UserAchievement {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}

interface Attempt {
  id: string;
  memoryPuzzleId?: string;
  logicPuzzleId?: string;
  success?: boolean;
  score?: number;
  startedAt?: string;
  durationMs?: number;
}

const GAMES_CONFIG: Record<
  string,
  {
    gameType: GameType;
    route: string;
  }
> = {
  memory: {
    gameType: GameType.memory,
    route: "/memory-game",
  },
  net: {
    gameType: GameType.logic,
    route: "/net-game",
  },
};

const PAGE_SIZE = 10;

// Inline AttemptItem component
function AttemptItem({
  attempt,
  gameType,
}: {
  attempt: Attempt;
  gameType: string;
}) {
  const isSuccess = attempt?.success;
  const statusColor = isSuccess ? COLORS.success : COLORS.error;
  const score = attempt?.score ?? "-";

  let dateFormatted = "-";
  if (attempt?.startedAt) {
    const dateObj = new Date(attempt.startedAt);
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    dateFormatted = `${day}/${month}`;
  }

  return (
    <View style={styles.attemptCard}>
      <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
      <View style={styles.attemptContent}>
        <View>
          <Text style={styles.attemptGameType}>{gameType}</Text>
          <Text style={styles.attemptDate}>{dateFormatted}</Text>
        </View>
        <Text style={[styles.attemptScore, { color: statusColor }]}>
          {score} pts
        </Text>
      </View>
    </View>
  );
}

export default function GameDetailScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const gameConfig = GAMES_CONFIG[gameId as string];
  const gameInfo = GAMES_INFO[gameId as string];

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAchievement, setSelectedAchievement] =
    useState<UserAchievement | null>(null);
<<<<<<< HEAD
  const [showInstructions, setShowInstructions] = useState(false);
=======
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))

  // Obtener logros del juego
  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useGetAchievementsUserGameType(gameConfig?.gameType || GameType.memory);

  console.log("🎮 Game Type:", gameConfig?.gameType);
  console.log(
    "📊 Achievements Data:",
    JSON.stringify(achievementsData, null, 2),
  );
  console.log("⏳ Loading:", achievementsLoading);
  console.log("❌ Error:", achievementsError);

  const achievementsArray: UserAchievement[] = Array.isArray(achievementsData)
    ? (achievementsData as UserAchievement[])
    : (achievementsData as { data?: UserAchievement[] })?.data || [];
  const unlockedCount = achievementsArray.filter(
    (a: UserAchievement) => a.unlocked,
  ).length;
  const totalCount = achievementsArray.length;

  const fetchAttempts = useCallback(
    async (pageOffset: number, append = true) => {
      if (!gameConfig) return;
      if (append && !hasMore) return;

      try {
        if (pageOffset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params: {
          limit: number;
          offset: number;
          gameType: GameType;
        } = {
          limit: PAGE_SIZE,
          offset: pageOffset,
          gameType: gameConfig.gameType,
        };

        const res = await getAttempts(params);
        let items: Attempt[] = [];
        if (Array.isArray(res)) items = res as Attempt[];

        if (items.length > 0) {
          setAttempts((prev) => (append ? [...prev, ...items] : items));
          setOffset(pageOffset + items.length);
          setHasMore(items.length === PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        console.error("Error fetching attempts:", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [gameConfig, hasMore],
  );

  useEffect(() => {
    if (gameConfig) {
      setAttempts([]);
      setOffset(0);
      setHasMore(true);
      fetchAttempts(0, false);
    }
  }, [gameConfig]);

  const loadMoreAttempts = () => {
    if (!loadingMore && hasMore) fetchAttempts(offset);
  };

  const handleRetry = () => {
    setError(null);
    refetchAchievements();
    fetchAttempts(0, false);
  };

  if (!gameConfig || !gameInfo) {
    return (
<<<<<<< HEAD
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.background}
          />
          <View style={STYLES.center}>
            <Text style={STYLES.heading}>❌ Juego no encontrado</Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={{ marginTop: 16 }}
              buttonColor={COLORS.primary}
            >
              Volver a Juegos
            </Button>
          </View>
        </SafeAreaView>
      </>
=======
      <SafeAreaView style={STYLES.safeArea} edges={["left", "right"]}>
        <CustomHeader title="Juego no encontrado" />
        <View style={STYLES.center}>
          <Text style={STYLES.heading}>❌ Juego no encontrado</Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
            buttonColor={COLORS.primary}
          >
            Volver a Juegos
          </Button>
        </View>
      </SafeAreaView>
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
    );
  }

  const detectGameType = (a: Attempt): string => {
    return (
      (a.memoryPuzzleId && "Memoria") || (a.logicPuzzleId && "Lógica") || ""
    );
  };

  return (
<<<<<<< HEAD
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <ScrollView
          contentContainerStyle={STYLES.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fullWidthContainer}>
            {/* Título del juego */}
            <Text style={[styles.title]}>{gameInfo.title}</Text>

            {/* Descripción del Juego */}
            <Card style={[styles.gameCard, { marginBottom: 16 }]}>
              <Card.Content>
                <Text
                  variant="bodyMedium"
                  style={{ color: COLORS.text, textAlign: "justify" }}
                >
                  {gameInfo.description}
                </Text>
              </Card.Content>
              <Card.Content>
                <Button
                  mode="text"
                  onPress={() => setShowInstructions(!showInstructions)}
                  icon={showInstructions ? "chevron-up" : "chevron-down"}
                  contentStyle={{ flexDirection: "row-reverse", paddingTop: 4 }}
                  labelStyle={{ fontSize: 16, fontWeight: "bold" }}
                  style={{ marginBottom: showInstructions ? 16 : 0 }}
                >
                  Cómo Jugar
                </Button>
                {showInstructions && (
                  <GameInstructions gameInfo={gameInfo} variant="card" />
                )}
              </Card.Content>
            </Card>

            {/* Botón Jugar */}
            <Button
              mode="contained"
              onPress={() =>
                router.push(gameConfig.route as "/memory-game" | "/net-game")
              }
              icon="play"
              buttonColor={COLORS.primary}
              style={{ marginBottom: 24 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              Jugar Ahora
            </Button>

            {/* Logros */}
            <Card style={[styles.gameCard, { marginBottom: 16 }]}>
              <Card.Content>
                <View style={styles.sectionHeader}>
=======
    <SafeAreaView style={STYLES.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <CustomHeader title={gameInfo.title} />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Información del Juego */}
          <Card style={[styles.gameCard, { marginBottom: 16 }]}>
            <Card.Content>
              <Text
                variant="bodyLarge"
                style={{ color: COLORS.text, marginBottom: 16 }}
              >
                {gameInfo.description}
              </Text>

              <Divider style={{ marginVertical: 12 }} />

              {/* Usar el componente GameInstructions */}
              <GameInstructions gameInfo={gameInfo} variant="card" />
            </Card.Content>
          </Card>

          {/* Botón Jugar */}
          <Button
            mode="contained"
            onPress={() =>
              router.push(gameConfig.route as "/memory-game" | "/net-game")
            }
            icon="play"
            buttonColor={COLORS.primary}
            style={{ marginBottom: 24 }}
            contentStyle={{ paddingVertical: 8 }}
          >
            Jugar Ahora
          </Button>

          {/* Logros */}
          <Card style={[styles.gameCard, { marginBottom: 16 }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={24}
                    color={COLORS.primary}
                  />
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
                  <Text
                    variant="titleLarge"
                    style={{
                      fontWeight: "bold",
<<<<<<< HEAD
                      color: COLORS.text,
=======
                      color: COLORS.primary,
                      marginLeft: 8,
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
                    }}
                  >
                    Logros
                  </Text>
<<<<<<< HEAD
                  <Chip
                    mode="flat"
                    style={{ backgroundColor: COLORS.primary }}
                    textStyle={{ color: COLORS.white, fontWeight: "bold" }}
                  >
                    {unlockedCount}/{totalCount}
                  </Chip>
                </View>

                {achievementsLoading && (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator />
                  </View>
                )}

                {achievementsError && (
                  <View style={styles.errorContainer}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: COLORS.error, marginBottom: 12 }}
                    >
                      ❌ Error al cargar los logros
                    </Text>
                    <Button mode="outlined" onPress={handleRetry}>
                      Reintentar
                    </Button>
                  </View>
                )}

                {!achievementsLoading && !achievementsError && (
                  <>
                    {achievementsArray.length === 0 ? (
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: COLORS.textSecondary,
                          textAlign: "center",
                          paddingVertical: 20,
                        }}
                      >
                        No hay logros disponibles para este juego aún.
                      </Text>
                    ) : (
                      <View style={styles.achievementsGrid}>
                        {achievementsArray.map(
                          (achievement: UserAchievement) => (
                            <Card
                              key={achievement.achievement.id}
                              style={[
                                styles.achievementCard,
                                !achievement.unlocked &&
                                  styles.achievementLocked,
                              ]}
                              onPress={() =>
                                setSelectedAchievement(achievement)
                              }
                            >
                              <Card.Content style={styles.achievementContent}>
                                <View style={styles.achievementIcon}>
                                  {achievement.unlocked ? (
                                    <Text style={{ fontSize: 40 }}>
                                      {achievement.achievement.icon || ""}
                                    </Text>
                                  ) : (
                                    <MaterialCommunityIcons
                                      name="lock"
                                      size={40}
                                      color="#999"
                                    />
                                  )}
                                </View>
                                <Text
                                  variant="labelMedium"
                                  style={[
                                    styles.achievementTitle,
                                    !achievement.unlocked &&
                                      styles.achievementTitleLocked,
                                  ]}
                                  numberOfLines={2}
                                >
                                  {achievement.achievement.title}
                                </Text>
                                <Chip
                                  mode="flat"
                                  compact
                                  style={{
                                    backgroundColor: achievement.unlocked
                                      ? COLORS.primary
                                      : COLORS.backgroundSecondary,
                                    marginTop: 8,
                                  }}
                                  textStyle={{
                                    color: achievement.unlocked
                                      ? COLORS.white
                                      : COLORS.textLight,
                                    fontSize: 11,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {achievement.achievement.points} pts
                                </Chip>
                              </Card.Content>
                            </Card>
                          ),
                        )}
                      </View>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Instrucciones (colapsable) */}

            {/* Puntajes Recientes */}
            <Card style={[styles.gameCard, { marginBottom: 16 }]}>
              <Card.Content>
                <Text
                  variant="titleLarge"
                  style={{
                    fontWeight: "bold",
                    color: COLORS.text,
                    marginBottom: 16,
                  }}
                >
                  Historial de Partidas
                </Text>

                {loading && !loadingMore && (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator />
                  </View>
                )}

                {error && !loading && (
                  <View style={styles.errorContainer}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: COLORS.error, marginBottom: 12 }}
                    >
                      ❌ Error al cargar el historial
                    </Text>
                    <Button mode="outlined" onPress={handleRetry}>
                      Reintentar
                    </Button>
                  </View>
                )}

                {!loading && !error && (
                  <>
                    {attempts.length === 0 ? (
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: COLORS.textSecondary,
                          textAlign: "center",
                          paddingVertical: 20,
                        }}
                      >
                        Aún no has jugado este juego. ¡Comienza ahora!
                      </Text>
                    ) : (
                      <>
                        {attempts.map((attempt) => (
                          <AttemptItem
                            key={attempt.id}
                            attempt={attempt}
                            gameType={detectGameType(attempt)}
                          />
                        ))}

                        {loadingMore && (
                          <View style={{ paddingVertical: 20 }}>
                            <ActivityIndicator />
                          </View>
                        )}

                        {hasMore && !loadingMore && (
                          <Button
                            mode="outlined"
                            onPress={loadMoreAttempts}
                            style={{ marginTop: 12 }}
                          >
                            Ver más
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>

        {/* Modal de detalle del logro */}
        <Portal>
          <Dialog
            visible={!!selectedAchievement}
            onDismiss={() => setSelectedAchievement(null)}
            style={{
              backgroundColor: COLORS.background,
              borderRadius: 16,
              width: "90%",
              alignSelf: "center",
            }}
          >
            <View style={{ alignItems: "center", paddingTop: 24 }}>
              {selectedAchievement?.unlocked ? (
                <Text style={{ fontSize: 64 }}>
                  {selectedAchievement?.achievement?.icon || "🏆"}
                </Text>
              ) : (
                <MaterialCommunityIcons
                  name="lock"
                  size={64}
                  color={COLORS.textLight}
                />
              )}
            </View>
            <Dialog.Title
              style={[
                styles.dialogTitle,
                { color: COLORS.text, fontWeight: "bold" },
              ]}
            >
              {selectedAchievement?.achievement?.title}
            </Dialog.Title>
            <Dialog.Content>
              <Text
                variant="bodyLarge"
                style={{
                  marginBottom: 16,
                  textAlign: "center",
                  color: COLORS.textSecondary,
                }}
              >
                {selectedAchievement?.achievement?.description}
              </Text>

              <Divider
                style={{ marginVertical: 12, backgroundColor: COLORS.border }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  marginTop: 8,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    variant="labelSmall"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Puntos
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={{ color: COLORS.primary, fontWeight: "bold" }}
                  >
                    {selectedAchievement?.achievement?.points}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text
                    variant="labelSmall"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Estado
                  </Text>
                  <Chip
                    mode="flat"
                    style={{
                      backgroundColor: selectedAchievement?.unlocked
                        ? COLORS.primary
                        : COLORS.backgroundSecondary,
                      marginTop: 4,
                    }}
                    textStyle={{
                      color: selectedAchievement?.unlocked
                        ? COLORS.white
                        : COLORS.text,
                      fontWeight: "bold",
                    }}
                  >
                    {selectedAchievement?.unlocked
                      ? "✓ Desbloqueado"
                      : "🔒 Bloqueado"}
                  </Chip>
                </View>
              </View>

              {selectedAchievement?.unlocked &&
                selectedAchievement?.unlockedAt && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: COLORS.textSecondary,
                      textAlign: "center",
                      marginTop: 16,
                    }}
                  >
                    Desbloqueado el{" "}
                    {new Date(
                      selectedAchievement?.unlockedAt,
                    ).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                )}
            </Dialog.Content>
            <Dialog.Actions
              style={{ paddingHorizontal: 24, paddingBottom: 16 }}
            >
              <Button
                mode="contained"
                onPress={() => setSelectedAchievement(null)}
                buttonColor={COLORS.primary}
                style={{ borderRadius: 12, width: "100%" }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Cerrar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </>
=======
                </View>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: COLORS.backgroundSecondary }}
                >
                  {unlockedCount}/{totalCount}
                </Chip>
              </View>

              {achievementsLoading && (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator />
                </View>
              )}

              {achievementsError && (
                <View style={styles.errorContainer}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: COLORS.error, marginBottom: 12 }}
                  >
                    ❌ Error al cargar los logros
                  </Text>
                  <Button mode="outlined" onPress={handleRetry}>
                    Reintentar
                  </Button>
                </View>
              )}

              {!achievementsLoading && !achievementsError && (
                <>
                  {achievementsArray.length === 0 ? (
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: COLORS.textSecondary,
                        textAlign: "center",
                        paddingVertical: 20,
                      }}
                    >
                      No hay logros disponibles para este juego aún.
                    </Text>
                  ) : (
                    <View style={styles.achievementsGrid}>
                      {achievementsArray.map((achievement: UserAchievement) => (
                        <Card
                          key={achievement.achievement.id}
                          style={[
                            styles.achievementCard,
                            !achievement.unlocked && styles.achievementLocked,
                          ]}
                          onPress={() => setSelectedAchievement(achievement)}
                        >
                          <Card.Content style={styles.achievementContent}>
                            <View style={styles.achievementIcon}>
                              {achievement.unlocked ? (
                                <Text style={{ fontSize: 32 }}>
                                  {achievement.achievement.icon || "🏆"}
                                </Text>
                              ) : (
                                <MaterialCommunityIcons
                                  name="lock"
                                  size={32}
                                  color="#999"
                                />
                              )}
                            </View>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.achievementTitle,
                                !achievement.unlocked &&
                                  styles.achievementTitleLocked,
                              ]}
                              numberOfLines={2}
                            >
                              {achievement.achievement.title}
                            </Text>
                            <Text
                              variant="labelSmall"
                              style={styles.achievementPoints}
                            >
                              {achievement.achievement.points} pts
                            </Text>
                          </Card.Content>
                        </Card>
                      ))}
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Puntajes Recientes */}
          <Card style={[styles.gameCard, { marginBottom: 16 }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="history"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text
                    variant="titleLarge"
                    style={{
                      fontWeight: "bold",
                      color: COLORS.primary,
                      marginLeft: 8,
                    }}
                  >
                    Puntajes Recientes
                  </Text>
                </View>
              </View>

              {loading && !loadingMore && (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator />
                </View>
              )}

              {error && !loading && (
                <View style={styles.errorContainer}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: COLORS.error, marginBottom: 12 }}
                  >
                    ❌ Error al cargar el historial
                  </Text>
                  <Button mode="outlined" onPress={handleRetry}>
                    Reintentar
                  </Button>
                </View>
              )}

              {!loading && !error && (
                <>
                  {attempts.length === 0 ? (
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: COLORS.textSecondary,
                        textAlign: "center",
                        paddingVertical: 20,
                      }}
                    >
                      Aún no has jugado este juego. ¡Comienza ahora!
                    </Text>
                  ) : (
                    <>
                      {attempts.map((attempt) => (
                        <AttemptItem
                          key={attempt.id}
                          attempt={attempt}
                          gameType={detectGameType(attempt)}
                        />
                      ))}

                      {loadingMore && (
                        <View style={{ paddingVertical: 20 }}>
                          <ActivityIndicator />
                        </View>
                      )}

                      {hasMore && !loadingMore && (
                        <Button
                          mode="outlined"
                          onPress={loadMoreAttempts}
                          style={{ marginTop: 12 }}
                        >
                          Ver más
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Modal de detalle del logro */}
      <Portal>
        <Dialog
          visible={!!selectedAchievement}
          onDismiss={() => setSelectedAchievement(null)}
        >
          <View style={{ alignItems: "center", paddingTop: 24 }}>
            {selectedAchievement?.unlocked ? (
              <Text style={{ fontSize: 64 }}>
                {selectedAchievement?.achievement?.icon || "🏆"}
              </Text>
            ) : (
              <MaterialCommunityIcons name="lock" size={64} color="#999" />
            )}
          </View>
          <Dialog.Title style={styles.dialogTitle}>
            {selectedAchievement?.achievement?.title}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyLarge"
              style={{ marginBottom: 16, textAlign: "center" }}
            >
              {selectedAchievement?.achievement?.description}
            </Text>

            <Divider style={{ marginVertical: 12 }} />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 8,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text
                  variant="labelSmall"
                  style={{ color: COLORS.textSecondary }}
                >
                  Puntos
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ color: COLORS.primary, fontWeight: "bold" }}
                >
                  {selectedAchievement?.achievement?.points}
                </Text>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text
                  variant="labelSmall"
                  style={{ color: COLORS.textSecondary }}
                >
                  Estado
                </Text>
                <Chip
                  mode="flat"
                  style={{
                    backgroundColor: selectedAchievement?.unlocked
                      ? COLORS.success
                      : COLORS.backgroundSecondary,
                    marginTop: 4,
                  }}
                  textStyle={{
                    color: selectedAchievement?.unlocked ? "#fff" : COLORS.text,
                  }}
                >
                  {selectedAchievement?.unlocked ? "Desbloqueado" : "Bloqueado"}
                </Chip>
              </View>
            </View>

            {selectedAchievement?.unlocked &&
              selectedAchievement?.unlockedAt && (
                <Text
                  variant="bodySmall"
                  style={{
                    color: COLORS.textSecondary,
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  Desbloqueado el{" "}
                  {new Date(selectedAchievement?.unlockedAt).toLocaleDateString(
                    "es-ES",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </Text>
              )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelectedAchievement(null)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  fullWidthContainer: {
    width: "100%",
    paddingHorizontal: 0,
  },
  title: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    fontSize: 24,
    fontFamily: FONT.bold,
  },
=======
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
  gameCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
<<<<<<< HEAD
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "30%",
    minWidth: 100,
=======
    justifyContent: "center",
  },
  achievementCard: {
    width: 90,
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    alignItems: "center",
<<<<<<< HEAD
    padding: 12,
  },
  achievementIcon: {
    marginBottom: 12,
=======
    padding: 8,
  },
  achievementIcon: {
    marginBottom: 8,
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
  },
  achievementTitle: {
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.text,
<<<<<<< HEAD
    minHeight: 36,
=======
    height: 28,
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
  },
  achievementTitleLocked: {
    color: "#999",
  },
<<<<<<< HEAD
=======
  achievementPoints: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: 4,
  },
>>>>>>> 412a822 (Mate hiperbolico (Final de la Release 3) (#69))
  errorContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  dialogTitle: {
    textAlign: "center",
  },
  attemptCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    ...SHADOWS.light,
  },
  statusStrip: {
    width: 4,
  },
  attemptContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  attemptGameType: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.text,
  },
  attemptDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  attemptScore: {
    fontWeight: "600",
    fontSize: 15,
  },
});
