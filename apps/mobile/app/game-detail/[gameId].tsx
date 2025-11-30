import React, { useState, useCallback, useEffect } from "react";
import { StatusBar, ScrollView, View, Image, StyleSheet } from "react-native";
import {
  ActivityIndicator,
  Text,
  Card,
  Button,
  Icon,
  Chip,
  Divider,
  Portal,
  Dialog,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES } from "@/styles/base";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  useGetAchievementsUserGameType,
  GameType,
  getAttempts,
} from "@elepad/api-client";
import AttemptCard from "@/components/Historial/AttemptCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GameHeader } from "@/components/shared/GameHeader";

const GAMES_CONFIG: Record<
  string,
  {
    title: string;
    emoji: string;
    iconName?: string;
    iconColor?: string;
    description: string;
    rules: string[];
    objective: string;
    illustrationUrl: string;
    gameType: GameType;
    route: string;
  }
> = {
  memory: {
    title: "Juego de Memoria",
    emoji: "🧠",
    description:
      "Un clásico juego de memoria donde debes encontrar todas las parejas de cartas iguales. Perfecta para entrenar tu memoria visual y concentración.",
    rules: [
      "Se muestran cartas boca abajo en el tablero",
      "Debes voltear dos cartas por turno",
      "Si las cartas coinciden, permanecen visibles",
      "Si no coinciden, se vuelven a ocultar",
      "Ganas cuando encuentras todas las parejas",
      "Intenta completar el juego con el menor número de movimientos",
    ],
    objective:
      "Encontrar todas las parejas de cartas iguales en el menor tiempo y con la menor cantidad de intentos posible.",
    illustrationUrl: "https://picsum.photos/seed/memory/800/400",
    gameType: GameType.memory,
    route: "/memory-game",
  },
  net: {
    title: "NET",
    emoji: "🌐",
    iconName: "lan",
    iconColor: "#2196F3",
    description:
      "Un desafiante juego de lógica donde debes conectar toda la red girando las casillas. Perfecto para mejorar tu pensamiento espacial y habilidades de resolución de problemas.",
    rules: [
      "Cada casilla contiene un segmento de red",
      "Toca una casilla para rotarla 90 grados",
      "Conecta todas las piezas para formar una red completa",
      "Todas las conexiones deben estar enlazadas",
      "No debe haber piezas desconectadas",
      "Completa el puzzle en el menor tiempo posible",
    ],
    objective:
      "Rotar todas las piezas hasta formar una red completamente conectada sin segmentos sueltos.",
    illustrationUrl: "https://picsum.photos/seed/network/800/400",
    gameType: GameType.logic,
    route: "/net-game",
  },
};

const PAGE_SIZE = 10;

export default function GameDetailScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const gameConfig = GAMES_CONFIG[gameId as string];

  const [attempts, setAttempts] = useState<any[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

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

  const achievementsArray = Array.isArray(achievementsData)
    ? achievementsData
    : achievementsData?.data || [];
  const unlockedCount = achievementsArray.filter((a) => a.unlocked).length;
  const totalCount = achievementsArray.length;

  const fetchAttempts = useCallback(
    async (pageOffset: number, append = true) => {
      if (!gameConfig) return;
      if (append && !hasMore) return;

      try {
        pageOffset === 0 ? setLoading(true) : setLoadingMore(true);
        setError(null);

        const params: any = {
          limit: PAGE_SIZE,
          offset: pageOffset,
          gameType: gameConfig.gameType,
        };

        const res = await getAttempts(params);
        let items: any[] = [];
        if (Array.isArray(res)) items = res;

        if (items.length > 0) {
          setAttempts((prev) => (append ? [...prev, ...items] : items));
          setOffset(pageOffset + items.length);
          setHasMore(items.length === PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      } catch (e: any) {
        setError(e);
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

  if (!gameConfig) {
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen
          options={{
            title: "Juego no encontrado",
            headerBackTitle: "Juegos",
          }}
        />
        <View style={STYLES.center}>
          <Text style={STYLES.heading}>❌ Juego no encontrado</Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
            Volver a Juegos
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const detectGameType = (a: any): string => {
    return (
      (a.memoryPuzzleId && "Memoria") ||
      (a.logicPuzzleId && "Lógica") ||
      (a.sudokuPuzzleId && "Cálculo") ||
      (a.attentionPuzzleId && "Atención")
    );
  };

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Header personalizado */}
          <GameHeader
            icon={gameConfig.iconName || gameConfig.emoji}
            title={gameConfig.title}
            subtitle={gameConfig.description}
            iconColor={gameConfig.iconColor}
            useIconComponent={!!gameConfig.iconName}
          />

          {/* Información del Juego */}
          <Card style={[STYLES.titleCard, { marginBottom: 16 }]}>
            <Card.Content>
              <Text
                variant="headlineMedium"
                style={{
                  fontWeight: "bold",
                  color: COLORS.primary,
                  marginBottom: 12,
                }}
              >
                {gameConfig.title}
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: COLORS.text, marginBottom: 16 }}
              >
                {gameConfig.description}
              </Text>

              <Divider style={{ marginVertical: 12 }} />

              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "bold",
                  color: COLORS.primary,
                  marginBottom: 8,
                }}
              >
                🎯 Objetivo
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: COLORS.text, marginBottom: 16 }}
              >
                {gameConfig.objective}
              </Text>

              <Divider style={{ marginVertical: 12 }} />

              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "bold",
                  color: COLORS.primary,
                  marginBottom: 8,
                }}
              >
                📋 Reglas
              </Text>
              {gameConfig.rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Text style={styles.ruleBullet}>•</Text>
                  <Text variant="bodyMedium" style={styles.ruleText}>
                    {rule}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Botón Jugar */}
          <Button
            mode="contained"
            onPress={() => router.push(gameConfig.route as any)}
            icon="play"
            buttonColor={COLORS.primary}
            style={{ marginBottom: 24 }}
            contentStyle={{ paddingVertical: 8 }}
          >
            Jugar Ahora
          </Button>

          {/* Logros */}
          <Card style={[STYLES.titleCard, { marginBottom: 16 }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="trophy"
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
                    Logros
                  </Text>
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
                      {achievementsArray.map((achievement) => (
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
          <Card style={[STYLES.titleCard, { marginBottom: 16 }]}>
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
                        <AttemptCard
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
  );
}

const styles = StyleSheet.create({
  ruleItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  ruleBullet: {
    fontSize: 16,
    marginRight: 8,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  ruleText: {
    flex: 1,
    color: COLORS.text,
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
    justifyContent: "center",
  },
  achievementCard: {
    width: 90,
    backgroundColor: COLORS.backgroundSecondary,
    elevation: 2,
    borderRadius: 12,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    alignItems: "center",
    padding: 8,
  },
  achievementIcon: {
    marginBottom: 8,
  },
  achievementTitle: {
    textAlign: "center",
    fontWeight: "bold",
    color: COLORS.text,
    height: 28,
  },
  achievementTitleLocked: {
    color: "#999",
  },
  achievementPoints: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginTop: 4,
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  dialogTitle: {
    textAlign: "center",
  },
});
