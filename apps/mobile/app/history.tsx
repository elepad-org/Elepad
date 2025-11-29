import React, { useCallback, useEffect, useState } from "react";
import { View, FlatList, SectionList, StyleSheet } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  Chip,
  Button,
  ProgressBar,
  useTheme,
  Icon,
  Avatar,
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
import { COLORS, STYLES } from "@/styles/base";
import AttemptCard from "@/components/Historial/AttemptCard";

const PAGE_SIZE = 50;

type Props = {
  initialAttempts?: any[];
};

export default function HistoryScreen({ initialAttempts = [] }: Props) {
  const theme = useTheme(); // Hook para usar colores del tema si faltan en COLORS
  const [selectedGame, setSelectedGame] = useState("all");

  const [attempts, setAttempts] = useState<any[]>(initialAttempts);
  const [offset, setOffset] = useState<number>(initialAttempts.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const gameTypes = Object.values(GameType) as string[];

  const gameTypesRender: Record<string, string> = {
    memory: "Memoria",
    logic: "Lógica",
    calculation: "Cálculo",
    attention: "Atención",
  };

  const statsQueries = gameTypes.map((gt) =>
    useGetAttemptsStatsGameType(gt as any),
  );

  const statsLoading = statsQueries.some((q) => q.isLoading);
  const globalLoading = loading || statsLoading;

  const detectGameType = (a: any): string => {
    return (
      (a.memoryPuzzleId && "Memoria") ||
      (a.logicPuzzleId && "Lógica") ||
      (a.sudokuPuzzleId && "Cálculo") ||
      (a.attentionPuzzleId && "Atención")
    );
  };

  const fetchPage = useCallback(
    async (pageOffset: number, append = true) => {
      if (append && !hasMore) return;

      try {
        pageOffset === 0 ? setLoading(true) : setLoadingMore(true);

        const params: any = { limit: PAGE_SIZE, offset: pageOffset };
        if (selectedGame !== "all") params.gameType = selectedGame;

        const res = await getAttempts(params);
        console.log(res);

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

  const renderAttemptCard = (item: any) => (
    <AttemptCard attempt={item} gameType={detectGameType(item)} />
  );

  // Estadisticas locales de c/ juego
  const renderStatsCard = (stats: any) => {
    const total = stats?.totalAttempts || 0;
    const success = stats?.successfulAttempts || 0;
    const best = stats?.bestScore ?? "-";

    const successRate = total > 0 ? success / total : 0;
    const successPercentage = Math.round(successRate * 100);

    return (
      <Card
        style={[
          styles.statsCard,
          { backgroundColor: COLORS.backgroundSecondary },
        ]}
      >
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text
              variant="titleSmall"
              style={{
                marginLeft: 8,
                color: COLORS.primary,
                fontWeight: "bold",
              }}
            >
              RENDIMIENTO
            </Text>
          </View>

          {/* Grid de KPIs */}
          <View style={styles.kpiContainer}>
            {/* KPI 1: Total partidas */}
            <View style={styles.kpiItem}>
              <Text variant="displaySmall" style={styles.kpiValue}>
                {total}
              </Text>
              <Text variant="bodySmall" style={styles.kpiLabel}>
                Partidas
              </Text>
            </View>

            {/* KPI 2: Mejor Puntaje */}
            <View style={styles.kpiItem}>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text
                  variant="displaySmall"
                  style={[styles.kpiValue, { color: "#FBC02D" }]}
                >
                  {best}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="trophy-variant"
                  size={12}
                  color="#FBC02D"
                  style={{ marginRight: 4 }}
                />
                <Text variant="bodySmall" style={styles.kpiLabel}>
                  Récord
                </Text>
              </View>
            </View>

            {/* KPI 3: Tasa de Éxito */}
            <View style={styles.kpiItem}>
              <Text
                variant="displaySmall"
                style={[
                  styles.kpiValue,
                  {
                    color:
                      successRate > 0.5 ? COLORS.success : theme.colors.error,
                  },
                ]}
              >
                {successPercentage}%
              </Text>
              <Text variant="bodySmall" style={styles.kpiLabel}>
                Éxito
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          {/* Barra de Progreso */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text variant="labelSmall">Tasa de victorias</Text>
              <Text variant="labelSmall">
                {success}/{total}
              </Text>
            </View>
            <ProgressBar
              progress={successRate}
              color={successRate > 0.5 ? COLORS.success : theme.colors.error}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.surfaceVariant,
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Calcular estadísticas globales
  const globalStats = statsQueries.reduce(
    (acc, query) => {
      const data = query.data;
      console.log(data);
      if (!data) return acc;
      return {
        //TODO: Arreglar tipos
        totalAttempts: acc.totalAttempts + (data.totalAttempts || 0),
        successfulAttempts:
          acc.successfulAttempts + (data.successfulAttempts || 0),
        // Para el puntaje se toma el máximo histórico de cualquier juego
        bestScore: Math.max(acc.bestScore, data.bestScore || 0),
      };
    },
    { totalAttempts: 0, successfulAttempts: 0, bestScore: 0 },
  );

  const statsToShow =
    selectedGame === "all"
      ? globalStats
      : statsQueries[gameTypes.indexOf(selectedGame)]?.data;

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
        <View style={{ paddingVertical: 20, paddingHorizontal: 10 }}>
          <Button
            mode="contained"
            onPress={loadMore}
            style={{ backgroundColor: COLORS.primary }}
          >
            Mostrar más
          </Button>
        </View>
      );
    }

    return <View style={{ height: 20 }} />;
  };

  return (
    <SafeAreaView style={STYLES.safeArea}>
      <View style={STYLES.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={[STYLES.heading, { marginBottom: 0 }]}> Historial</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginVertical: 8,
          }}
        >
          <Chip
            selected={selectedGame === "all"}
            onPress={() => setSelectedGame("all")}
            style={
              selectedGame === "all"
                ? { backgroundColor: COLORS.success, borderColor: "#000" }
                : { backgroundColor: COLORS.background, borderColor: "#000" }
            }
            textStyle={selectedGame === "all" ? { color: "#fff" } : undefined}
          >
            Todos
          </Chip>
          {gameTypes.map((gt) => (
            <Chip
              key={gt}
              selected={selectedGame === gt}
              onPress={() => setSelectedGame(gt)}
              style={
                selectedGame === gt
                  ? { backgroundColor: COLORS.success, borderColor: "#000" }
                  : { backgroundColor: COLORS.background, borderColor: "#000" }
              }
              textStyle={selectedGame === gt ? { color: "#fff" } : undefined}
            >
              {gameTypesRender[gt]}
            </Chip>
          ))}
        </View>

        {globalLoading && !loadingMore && (
          <View style={STYLES.center}>
            <ActivityIndicator />
          </View>
        )}

        {globalLoading && !loadingMore && (
          <View style={STYLES.center}>
            <ActivityIndicator />
          </View>
        )}

        {/* Estadísticas */}
        {renderStatsCard(statsToShow)}
        <FlatList
          data={attempts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderAttemptCard(item)}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* Listado de intentos */}
        {selectedGame !== "all" ? (
          <>
            <FlatList
              data={attempts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderAttemptCard(item)}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        ) : (
          <FlatList
            data={attempts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderAttemptCard(item)}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    width: "80%",
  },
  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  kpiItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  kpiValue: {
    fontWeight: "bold",
    fontSize: 24, // Ajustado para que quepa bien
    marginBottom: 2,
  },
  kpiLabel: {
    opacity: 0.6,
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
