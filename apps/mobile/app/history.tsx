import React, { useCallback, useEffect, useState, useMemo } from "react";
import { View, FlatList, StyleSheet, StatusBar } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
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
  useGetFamilyGroupIdGroupMembers,
} from "@elepad/api-client";
import { Divider } from "react-native-paper";
import { COLORS, STYLES, SHADOWS, FONT } from "@/styles/base";
import StatisticsChart from "@/components/Historial/StatisticsChart";
import { useAuth } from "@/hooks/useAuth";
import DropdownSelect from "@/components/shared/DropdownSelect";
import { BackButton } from "@/components/shared/BackButton";
import { useStatisticsTour } from "@/hooks/tours/useStatisticsTour";
import AttemptCard from "@/components/Historial/AttemptCard";

const PAGE_SIZE = 50;

interface Attempt {
  id: string;
  memoryPuzzleId?: string;
  logicPuzzleId?: string;
  sudokuPuzzleId?: string;
  isFocusGame: boolean;
  success?: boolean;
  score?: number;
  startedAt?: string;
  durationMs?: number;
}

type Props = {
  initialAttempts?: Attempt[];
  activeTab?: string;
};



export default function HistoryScreen({ initialAttempts = [], activeTab = "" }: Props) {
  const { userElepad } = useAuth();

  const [selectedGame, setSelectedGame] = useState("all");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  const [offset, setOffset] = useState<number>(initialAttempts.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isHelper = !userElepad?.elder;
  const groupId = userElepad?.groupId;

  // Determine the title based on view parameter
  const getTitle = () => {
    if (isHelper) {
      return "Estadísticas";
    }
    return "Historial";
  };

  // Fetch family members to get elders list
  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId || "", {
    query: { enabled: !!groupId && isHelper },
  });

  // Get elders from family group
  const elders = useMemo(() => {
    if (!isHelper || !membersQuery.data) return [];

    interface GroupMember {
      id: string;
      displayName: string;
      elder: boolean;
      avatarUrl?: string | null;
    }

    const groupInfo = membersQuery.data as { members?: GroupMember[]; owner?: GroupMember };
    const allMembers = [
      ...(groupInfo.members || []),
      ...(groupInfo.owner ? [groupInfo.owner] : [])
    ];

    return allMembers.filter((member: GroupMember) => member.elder === true);
  }, [membersQuery.data, isHelper]);

  // Set default selected elder
  useEffect(() => {
    if (isHelper && elders.length > 0 && !selectedElderId) {
      setSelectedElderId(elders[0].id);
    }
  }, [elders, selectedElderId, isHelper]);

  const gameTypes = Object.values(GameType);

  const gameTypesRender: Record<string, string> = {
    memory: "Memoria",
    logic: "NET",
    attention: "Sudoku",
    reaction: "Focus"
  };

  const statsQueries = gameTypes.map((gt) =>
    useGetAttemptsStatsGameType(gt as GameType),
  );

  // Calculate stats locally for helpers from filtered attempts
  const getStatsFromAttempts = useCallback((gameType: GameType | "all") => {
    if (!isHelper) {
      // For non-helpers, use regular stats queries
      if (gameType === "all") {
        return statsQueries.reduce(
          (acc, query) => {
            const data = query.data as StatsData | undefined;
            if (!data) return acc;
            return {
              totalAttempts: acc.totalAttempts + (data.totalAttempts || 0),
              successfulAttempts: acc.successfulAttempts + (data.successfulAttempts || 0),
              bestScore: Math.max(acc.bestScore, data.bestScore || 0),
            };
          },
          { totalAttempts: 0, successfulAttempts: 0, bestScore: 0 }
        );
      } else {
        const idx = gameTypes.indexOf(gameType);
        const data = statsQueries[idx]?.data as StatsData | undefined;
        return data || { totalAttempts: 0, successfulAttempts: 0, bestScore: 0 };
      }
    }

    // For helpers, ALWAYS calculate stats from filtered attempts
    const filteredAttempts = gameType === "all"
      ? attempts
      : attempts.filter(attempt => {
        if (gameType === GameType.memory) return !!attempt.memoryPuzzleId;
        if (gameType === GameType.logic) return !!attempt.logicPuzzleId;
        if (gameType === GameType.attention) return !!attempt.sudokuPuzzleId;
        if (gameType === GameType.reaction) return !!attempt.isFocusGame;
        return false;
      });

    return {
      totalAttempts: filteredAttempts.length,
      successfulAttempts: filteredAttempts.filter(a => a.success === true).length,
      bestScore: filteredAttempts.length > 0 ? Math.max(...filteredAttempts.map(a => a.score || 0)) : 0,
    };
  }, [attempts, isHelper, statsQueries, gameTypes]);

  const statsLoading = statsQueries.some((q) => q.isLoading);
  const isLoading = loading || statsLoading;
  const globalLoading = loading || statsLoading;

  const detectGameType = (a: Attempt): string => {
    return (
      (a.memoryPuzzleId && "Memoria") || (a.logicPuzzleId && "NET") || (a.sudokuPuzzleId && "Sudoku") || (a.isFocusGame && "Focus") || ""
    );
  };

  const { headerRef, filtersRef, chartRef, summaryRef, historyRef } = useStatisticsTour({
    activeTab,
    loading: isLoading, // Using isLoading from auth/stats logic combination ideally, but using statsQueries loading state + global loading
    isHelper,
  });

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
          userId?: string;
        } = { limit: PAGE_SIZE, offset: pageOffset };

        if (selectedGame !== "all") params.gameType = selectedGame as GameType;

        // If helper, filter by selected elder's attempts
        if (isHelper && selectedElderId) {
          params.userId = selectedElderId;
          console.log('Fetching attempts for elder:', selectedElderId);
        }

        console.log('Fetch params:', params);
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
    [hasMore, selectedGame, isHelper, selectedElderId],
  );

  useEffect(() => {
    setAttempts([]);
    setOffset(0);
    setHasMore(true);
    fetchPage(0, false);
  }, [selectedGame, selectedElderId]);

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
    const stats = getStatsFromAttempts(selectedGame as GameType | "all");
    console.log('Stats calculation:', {
      isHelper,
      selectedGame,
      selectedElderId,
      attemptsLength: attempts.length,
      calculatedStats: stats
    });
    return stats;
  }, [selectedGame, getStatsFromAttempts, isHelper, selectedElderId, attempts]);

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
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Button
            mode="text"
            onPress={loadMore}
            textColor={COLORS.primary}
          >
            Mostrar más
          </Button>
          {isHelper && <View style={{ height: 100 }} />}
        </View>
      );
    }

    return isHelper ? <View style={{ height: 100 }} /> : null;
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
          {!isHelper ? (
            <View style={styles.headerRow}>
              <BackButton size={28} />
              <Text style={[styles.title, styles.titleWithBack]}>{getTitle()}</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
              <View ref={headerRef} style={{ alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 26, fontFamily: FONT.bold, color: COLORS.text }}>
                  {getTitle()}
                </Text>
              </View>
            </View>
          )}

          {/* Elder selector for helpers */}
          {isHelper && (
            <>
              {elders.length === 0 ? (
                <View style={styles.noEldersCard}>
                  <MaterialCommunityIcons
                    name="account-alert"
                    size={48}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.noEldersTitle}>
                    No hay adultos mayores
                  </Text>
                  <Text style={styles.noEldersDescription}>
                    No se encontraron adultos mayores en tu grupo familiar para mostrar estadísticas.
                  </Text>
                </View>
              ) : (
                <View style={styles.filterContainer} ref={filtersRef}>
                  <View style={{ width: "48%", minWidth: 170 }}>
                    <DropdownSelect
                      label="Estadísticas de"
                      value={selectedElderId || ""}
                      showLabel={false}
                      options={elders.map((elder) => ({
                        key: elder.id,
                        label: elder.displayName,
                        avatarUrl: elder.avatarUrl,
                      }))}
                      onSelect={setSelectedElderId}
                      placeholder="Seleccionar adulto mayor"
                    />
                  </View>
                  <View style={{ width: "50%", minWidth: 170 }}>
                    <DropdownSelect
                      label="Tipo de juego"
                      value={selectedGame}
                      showLabel={false}
                      options={[
                        { key: "all", label: "Todos", icon: "gamepad-variant" },
                        ...gameTypes.map((gt) => ({
                          key: gt,
                          label: gameTypesRender[gt],
                          icon: gt === GameType.memory ? "brain" :
                            gt === GameType.logic ? "puzzle" :
                              gt === GameType.attention ? "eye" : "lightning-bolt"
                        }))
                      ]}
                      //style={{minHeight:100}}
                      onSelect={setSelectedGame}
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* Don't show anything else if helper and no elders */}
          {isHelper && elders.length === 0 ? null : (
            <>

              {/* Filter Dropdown for elders only */}
              {!isHelper && (
                <View style={styles.filterContainer}>
                  <View style={{ width: "50%", minWidth: 170, alignSelf: "flex-start" }}>
                    <DropdownSelect
                      label="Tipo de juego"
                      value={selectedGame}
                      showLabel={false}
                      options={[
                        { key: "all", label: "Todos", icon: "gamepad-variant" },
                        ...gameTypes.map((gt) => ({
                          key: gt,
                          label: gameTypesRender[gt],
                          icon: gt === GameType.memory ? "brain" :
                            gt === GameType.logic ? "puzzle" :
                              gt === GameType.attention ? "eye" : "lightning-bolt"
                        }))
                      ]}
                      onSelect={setSelectedGame}
                    />
                  </View>
                </View>
              )}

              {globalLoading && !loadingMore ? (
                <View style={STYLES.center}>
                  <ActivityIndicator />
                </View>
              ) : (
                <FlatList
                  data={attempts}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <AttemptCard
                      attempt={item}
                      gameType={detectGameType(item)}
                      userTimezone={userElepad?.timezone}
                      viewRef={index === 0 ? historyRef : undefined}
                    />
                  )}
                  ListHeaderComponent={
                    <>
                      {/* Sección de Estadísticas */}
                      <View ref={chartRef}>
                        <StatisticsChart
                          attempts={attempts}
                          timeRange={timeRange}
                          onTimeRangeChange={setTimeRange}
                        />
                      </View>

                      {/* Tarjeta de Rendimiento */}
                      <Card style={styles.statsCard} ref={summaryRef}>
                        <Card.Content>
                          <View style={styles.statsHeader}>
                            <MaterialCommunityIcons
                              name="chart-box-outline"
                              size={20}
                              color={COLORS.primary}
                            />
                            <Text style={styles.statsTitle}>Rendimiento </Text>
                          </View>

                          <View style={styles.kpiContainer}>
                            <View style={styles.kpiItem}>
                              <Text style={styles.kpiValue}>{total}</Text>
                              <Text style={styles.kpiLabel}>Partidas</Text>
                            </View>
                            <View style={styles.kpiItem}>
                              <Text style={[styles.kpiValue, { color: COLORS.primary }]}>
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
                    </>
                  }
                  ListFooterComponent={renderFooter}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    fontSize: 26,
    fontFamily: FONT.bold,
  },
  titleWithBack: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
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
  noEldersCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 16,
    ...SHADOWS.card,
  },
  noEldersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noEldersDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  elderSelectorContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  elderSelectorLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  elderSelector: {
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
});
