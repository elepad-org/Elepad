import React, { useCallback, useEffect, useState, useMemo } from "react";
import { View, FlatList, StyleSheet, StatusBar } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  Button,
  ProgressBar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  useGetAttemptsStatsGameType,
  GameType,
  getAttempts,
} from "@elepad/api-client";
import { Divider } from "react-native-paper";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";

const PAGE_SIZE = 50;

interface Attempt {
  id: string;
  memoryPuzzleId?: string;
  logicPuzzleId?: string;
  success?: boolean;
  score?: number;
  startedAt?: string;
  durationMs?: number;
}

type Props = {
  initialAttempts?: Attempt[];
};

// Inline AttemptCard component for consistency
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
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    dateFormatted = `${day}/${month} - ${hours}:${minutes}`;
  }

  let durationFormatted = "-";
  if (attempt?.durationMs) {
    const totalSeconds = Math.floor(attempt.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    durationFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <View
      style={[
        styles.attemptCard,
        { backgroundColor: COLORS.backgroundSecondary },
      ]}
    >
      <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
      <View style={styles.attemptContent}>
        <View style={styles.attemptLeft}>
          <Text style={styles.attemptGameType}>{gameType}</Text>
          <View style={styles.attemptMeta}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={14}
              color={COLORS.textLight}
            />
            <Text style={styles.attemptMetaText}>{dateFormatted}</Text>
          </View>
        </View>
        <View style={styles.attemptRight}>
          <Text style={[styles.attemptScore, { color: statusColor }]}>
            {score} pts
          </Text>
          <View style={styles.attemptMeta}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={14}
              color={COLORS.textLight}
            />
            <Text style={styles.attemptMetaText}>{durationFormatted}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen({ initialAttempts = [] }: Props) {
  const [selectedGame, setSelectedGame] = useState("all");

  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  const [offset, setOffset] = useState<number>(initialAttempts.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const gameTypes = Object.values(GameType);

  const gameTypesRender: Record<string, string> = {
    memory: "Memoria",
    logic: "Lógica",
  };

  const statsQueries = gameTypes.map((gt) =>
    useGetAttemptsStatsGameType(gt as GameType),
  );

  const statsLoading = statsQueries.some((q) => q.isLoading);
  const globalLoading = loading || statsLoading;

  const detectGameType = (a: Attempt): string => {
    return (
      (a.memoryPuzzleId && "Memoria") || (a.logicPuzzleId && "Lógica") || ""
    );
  };

  const fetchPage = useCallback(
    async (pageOffset: number, append = true) => {
      if (append && !hasMore) return;

      try {
        if (pageOffset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params: {
          limit: number;
          offset: number;
          gameType?: GameType;
        } = { limit: PAGE_SIZE, offset: pageOffset };
        if (selectedGame !== "all") params.gameType = selectedGame as GameType;

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
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasMore, selectedGame],
  );

  useEffect(() => {
    setAttempts([]);
    setOffset(0);
    setHasMore(true);
    fetchPage(0, false);
  }, [selectedGame]);

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchPage(offset);
  };

  // Type for stats response
  type StatsData = {
    totalAttempts?: number;
    successfulAttempts?: number;
    bestScore?: number;
  };

  const statsToShow = useMemo(() => {
    if (selectedGame === "all") {
      return statsQueries.reduce(
        (acc, query) => {
          const data = query.data as StatsData | undefined;
          if (!data) return acc;
          return {
            totalAttempts: acc.totalAttempts + (data.totalAttempts || 0),
            successfulAttempts:
              acc.successfulAttempts + (data.successfulAttempts || 0),
            bestScore: Math.max(acc.bestScore, data.bestScore || 0),
          };
        },
        { totalAttempts: 0, successfulAttempts: 0, bestScore: 0 },
      );
    } else {
      const idx = gameTypes.indexOf(selectedGame as GameType);
      const data = statsQueries[idx]?.data as StatsData | undefined;
      return (
        data || {
          totalAttempts: 0,
          successfulAttempts: 0,
          bestScore: 0,
        }
      );
    }
  }, [selectedGame, statsQueries, gameTypes]);

  const total = statsToShow?.totalAttempts || 0;
  const success = statsToShow?.successfulAttempts || 0;
  const best = statsToShow?.bestScore ?? "-";
  const successRate = total > 0 ? success / total : 0;
  const successPercentage = Math.round(successRate * 100);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator animating={true} />
        </View>
      );
    }

    if (hasMore && attempts.length > 0) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <Button
            mode="contained"
            onPress={loadMore}
            buttonColor={COLORS.primary}
            style={{ borderRadius: 12 }}
          >
            Mostrar más
          </Button>
        </View>
      );
    }

    return <View style={{ height: 20 }} />;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={STYLES.superHeading}>Historial</Text>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterContainer}>
            <Chip
              selected={selectedGame === "all"}
              onPress={() => setSelectedGame("all")}
              style={[
                styles.chip,
                selectedGame === "all" && styles.chipSelected,
              ]}
              textStyle={
                selectedGame === "all"
                  ? { color: COLORS.white }
                  : { color: COLORS.text }
              }
            >
              Todos
            </Chip>
            {gameTypes.map((gt) => (
              <Chip
                key={gt}
                selected={selectedGame === gt}
                onPress={() => setSelectedGame(gt)}
                style={[
                  styles.chip,
                  selectedGame === gt && styles.chipSelected,
                ]}
                textStyle={
                  selectedGame === gt
                    ? { color: COLORS.white }
                    : { color: COLORS.text }
                }
              >
                {gameTypesRender[gt]}
              </Chip>
            ))}
          </View>

          {globalLoading && !loadingMore ? (
            <View style={STYLES.center}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={attempts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AttemptItem attempt={item} gameType={detectGameType(item)} />
              )}
              ListHeaderComponent={
                <Card style={styles.statsCard}>
                  <Card.Content>
                    <View style={styles.statsHeader}>
                      <MaterialCommunityIcons
                        name="chart-box-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                      <Text style={styles.statsTitle}>Rendimiento</Text>
                    </View>

                    <View style={styles.kpiContainer}>
                      <View style={styles.kpiItem}>
                        <Text style={styles.kpiValue}>{total}</Text>
                        <Text style={styles.kpiLabel}>Partidas</Text>
                      </View>
                      <View style={styles.kpiItem}>
                        <Text style={[styles.kpiValue, { color: "#FBC02D" }]}>
                          {best}
                        </Text>
                        <Text style={styles.kpiLabel}>Récord</Text>
                      </View>
                      <View style={styles.kpiItem}>
                        <Text
                          style={[
                            styles.kpiValue,
                            {
                              color:
                                successRate > 0.5
                                  ? COLORS.success
                                  : COLORS.error,
                            },
                          ]}
                        >
                          {successPercentage}%
                        </Text>
                        <Text style={styles.kpiLabel}>Éxito</Text>
                      </View>
                    </View>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>
                        Tasa de victorias
                      </Text>
                      <Text style={styles.progressLabel}>
                        {success}/{total}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={successRate}
                      color={successRate > 0.5 ? COLORS.success : COLORS.error}
                      style={styles.progressBar}
                    />
                  </Card.Content>
                </Card>
              }
              ListFooterComponent={renderFooter}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignContent: "flex-start",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statsTitle: {
    marginLeft: 8,
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
  },
  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  kpiItem: {
    alignItems: "center",
  },
  kpiValue: {
    fontWeight: "bold",
    fontSize: 24,
    color: COLORS.text,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: "uppercase",
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  attemptCard: {
    flexDirection: "row",
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
  attemptLeft: {
    flex: 1,
  },
  attemptRight: {
    alignItems: "flex-end",
  },
  attemptGameType: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 4,
  },
  attemptScore: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 4,
  },
  attemptMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  attemptMetaText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
});
