import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, FlatList, ScrollView } from "react-native";
import { Text, Card, ActivityIndicator, Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  useGetAttemptsStatsGameType,
  GameType,
  getAttempts,
} from "@elepad/api-client";
import { Divider } from "react-native-paper";
import { STYLES } from "@/styles/base";
import AttemptCard from "@/components/Historial/AttemptCard";

const PAGE_SIZE = 50;

type Props = {
  initialAttempts?: any[];
};

export default function HistoryScreen({ initialAttempts = [] }: Props) {
  const [selectedGame, setSelectedGame] = useState("all");

  const [attempts, setAttempts] = useState<any[]>(initialAttempts);
  const [offset, setOffset] = useState<number>(initialAttempts.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const gameTypes = Object.values(GameType) as string[];

  //Puede hacerse mejor
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
    if (!a) return "unknown";
    return (
      (a.memoryPuzzleId && "memory") ||
      (a.logicPuzzleId && "logic") ||
      (a.sudokuPuzzleId && "calculation")
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
        //console.log(res)

        if (Array.isArray(res) && res.length > 0) {
          setAttempts((prev) => (append ? [...prev, ...res] : res));
          setOffset(pageOffset + res.length);
          setHasMore(res.length === PAGE_SIZE);
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

  const filteredAttempts = useMemo(() => {
    if (selectedGame === "all") return attempts;
    return attempts.filter((a) => detectGameType(a) === selectedGame);
  }, [attempts, selectedGame]);
  console.log(filteredAttempts);

  const renderAttemptCard = (item: any) => <AttemptCard attempt={item} />;

  const renderStatsCard = (stats: any) => (
    <Card style={[{ marginBottom: 12 }]}>
      <Card.Content>
        <Text>Total intentos: {stats?.totalAttempts ?? "-"}</Text>
        <Text>Intentos exitosos: {stats?.successfulAttempts ?? "-"}</Text>
        <Text>Mejor puntaje: {stats?.bestScore ?? "-"}</Text>
      </Card.Content>
    </Card>
  );

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
          >
            Todos
          </Chip>
          {gameTypes.map((gt) => (
            <Chip
              key={gt}
              selected={selectedGame === gt}
              onPress={() => setSelectedGame(gt)}
            >
              {gameTypesRender[gt]}
            </Chip>
          ))}
        </View>

        {globalLoading && (
          <View style={STYLES.center}>
            <ActivityIndicator />
          </View>
        )}
        <ScrollView>
          {selectedGame !== "all" ? (
            <>
              {renderStatsCard(
                statsQueries[gameTypes.indexOf(selectedGame)]?.data,
              )}

              <FlatList
                data={attempts.filter(
                  (a) => detectGameType(a) === selectedGame,
                )}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => renderAttemptCard(item)}
                onEndReachedThreshold={0.5}
                onEndReached={loadMore}
                ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
              />
            </>
          ) : (
            <>
              {gameTypes.map((gt) => {
                const gameAttempts = attempts.filter(
                  (a) => detectGameType(a) === gt,
                );

                return (
                  <View key={gt} style={{ marginBottom: 16 }}>
                    <Text style={[STYLES.subheading, { marginBottom: 8 }]}>
                      {gameTypesRender[gt].toUpperCase()}
                    </Text>

                    {gameAttempts.length === 0 ? (
                      <View
                        style={{ alignItems: "center", paddingVertical: 24 }}
                      >
                        <Text style={STYLES.subheading}>
                          No hay registro de partidas para este juego aún.
                        </Text>
                      </View>
                    ) : (
                      gameAttempts.map((item) => renderAttemptCard(item))
                    )}

                    <Divider style={{ marginTop: 10 }} />
                  </View>
                );
              })}

              {loadingMore && (
                <View style={STYLES.center}>
                  <ActivityIndicator />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
