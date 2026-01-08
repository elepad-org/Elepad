import {
  StatusBar,
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ActivityIndicator, Text, Button, Icon, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS, LAYOUT } from "@/styles/base";
import { router } from "expo-router";
import React, { useState } from "react";

// Import components from the history screen for statistics display
import {
  useGetAttemptsStatsGameType,
  GameType,
  useGetFamilyGroupIdGroupMembers,
} from "@elepad/api-client";
import ActivitiesList from "@/components/ActivitiesList";

interface GameCardProps {
  emoji?: string;
  iconName?: string;
  title: string;
  description: string;
  onPlay: () => void;
  onDetails: () => void;
}

function GameCard({
  emoji,
  iconName,
  title,
  description,
  onPlay,
  onDetails,
}: GameCardProps) {
  return (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={onDetails}
      activeOpacity={0.7}
    >
      <View style={styles.gameCardContent}>
        <View style={styles.gameIconContainer}>
          {iconName ? (
            <Icon source={iconName} size={32} color={COLORS.primary} />
          ) : (
            <Text style={styles.gameEmoji}>{emoji}</Text>
          )}
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>{title}</Text>
          <Text style={styles.gameDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlay}
          activeOpacity={0.7}
        >
          <Icon source="play" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface GameStatsCardProps {
  title: string;
  emoji?: string;
  iconName?: string;
  stats: any;
  loading: boolean;
}

function GameStatsCard({ title, emoji, iconName, stats, loading }: GameStatsCardProps) {
  if (loading) {
    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsCardContent}>
            <View style={styles.gameIconContainer}>
              {iconName ? (
                <Icon source={iconName} size={24} color={COLORS.primary} />
              ) : (
                <Text style={styles.statsEmoji}>{emoji}</Text>
              )}
            </View>
            <View style={styles.statsInfo}>
              <Text style={styles.statsTitle}>{title}</Text>
              <ActivityIndicator size="small" />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const totalGames = stats?.totalAttempts || 0;
  const successRate = totalGames > 0 ? Math.round(((stats?.totalSuccessfulAttempts || 0) / totalGames) * 100) : 0;
  const averageScore = stats?.averageScore || 0;

  return (
    <Card style={styles.statsCard}>
      <Card.Content>
        <View style={styles.statsCardContent}>
          <View style={styles.gameIconContainer}>
            {iconName ? (
              <Icon source={iconName} size={24} color={COLORS.primary} />
            ) : (
              <Text style={styles.statsEmoji}>{emoji}</Text>
            )}
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>{title}</Text>
            <View style={styles.statsDetails}>
              <Text style={styles.statItem}>
                {totalGames} partidas • {successRate}% éxito
              </Text>
              <Text style={styles.statItem}>
                Promedio: {Math.round(averageScore)} pts
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function JuegosScreen() {
  const { loading, userElepad } = useAuth();

  if (loading) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const isElder = userElepad?.elder === true;

  // Si es ayudante, mostrar estadísticas e historial directamente
  if (!isElder) {
    return <StatisticsView />;
  }

  // Vista de elder (juegos) - mantenemos tal como está
  return <GamesView />;
}

// Component for non-elder users showing statistics and history
function StatisticsView() {
  const { userElepad } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  // Get statistics data for each game type
  const memoryStats = useGetAttemptsStatsGameType(GameType.memory);
  const netStats = useGetAttemptsStatsGameType(GameType.net);
  const sudokuStats = useGetAttemptsStatsGameType(GameType.sudoku);
  const focusStats = useGetAttemptsStatsGameType(GameType.focus);

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: LAYOUT.bottomNavHeight },
        ]}
      >
        <View style={STYLES.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={STYLES.superHeading}>Estadísticas</Text>
          </View>

          {/* Statistics Cards */}
          <View style={styles.statisticsContainer}>
            <GameStatsCard
              title="Memoria"
              emoji="🧠"
              stats={memoryStats.data}
              loading={memoryStats.isLoading}
            />
            <GameStatsCard
              title="NET"
              iconName="lan"
              stats={netStats.data}
              loading={netStats.isLoading}
            />
            <GameStatsCard
              title="Sudoku"
              emoji="🔢"
              stats={sudokuStats.data}
              loading={sudokuStats.isLoading}
            />
            <GameStatsCard
              title="Focus"
              emoji="🎯"
              stats={focusStats.data}
              loading={focusStats.isLoading}
            />
          </View>

          {/* Activities List (Historial) */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historial Reciente</Text>
            <ActivitiesList />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Component for elder users showing games - keeping original functionality
function GamesView() {
  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: LAYOUT.bottomNavHeight },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={STYLES.superHeading}>Juegos</Text>
            <Button
              mode="contained"
              onPress={() => router.navigate("/history")}
              style={STYLES.miniButton}
              icon="history"
            >
              Historial
            </Button>
          </View>

          {/* Games List */}
          <View style={styles.gamesContainer}>
            <GameCard
              emoji="🧠"
              title="Memoria"
              description="Encuentra parejas de cartas y entrena tu memoria"
              onPlay={() => router.push("/memory-game")}
              onDetails={() => router.push("/game-detail/memory")}
            />

            <GameCard
              iconName="lan"
              title="NET"
              description="Conecta la red girando las piezas"
              onPlay={() => router.push("/net-game")}
              onDetails={() => router.push("/game-detail/net")}
            />

            <GameCard
              emoji="🔢"
              title="Sudoku"
              description="Completa el tablero con números del 1 al 9"
              onPlay={() => router.push("/sudoku-game")}
              onDetails={() => router.push("/game-detail/sudoku")}
            />

            <GameCard
              emoji="🎯"
              title="Focus"
              description="Selecciona el color indicado por la palabra."
              onPlay={() => router.push("/focus-game")}
              onDetails={() => router.push("/game-detail/focus")}
            />
          </View>

          {/* Coming Soon */}
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonEmoji}>🎮</Text>
            <Text style={styles.comingSoonTitle}>Próximamente</Text>
            <Text style={styles.comingSoonText}>
              Nuevos juegos: rompecabezas y más
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  gamesContainer: {
    width: "100%",
    gap: 12,
  },
  gameCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.card,
  },
  gameCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  gameEmoji: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  comingSoonCard: {
    marginTop: 24,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
  },
  comingSoonEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  // New styles for statistics view
  statisticsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 32,
  },
  historySection: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    ...SHADOWS.card,
  },
  statsCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsEmoji: {
    fontSize: 20,
  },
  statsInfo: {
    flex: 1,
    marginLeft: 14,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  statsDetails: {
    gap: 2,
  },
  statItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
