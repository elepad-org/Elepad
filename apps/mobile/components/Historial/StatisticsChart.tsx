import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Text, SegmentedButtons } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { COLORS, FONT } from "@/styles/base";

interface Attempt {
  id: string;
  score?: number;
  startedAt?: string;
  success?: boolean;
  durationMs?: number;
}

interface StatisticsChartProps {
  attempts: Attempt[];
  timeRange: "week" | "month" | "year";
  onTimeRangeChange: (value: "week" | "month" | "year") => void;
}

interface DataPoint {
  date: Date;
  score: number;
  count: number;
}

const screenWidth = Dimensions.get("window").width;

export default function StatisticsChart({
  attempts,
  timeRange,
  onTimeRangeChange,
}: StatisticsChartProps) {
  const chartData = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return null;
    }

    // Filtrar intentos por rango de tiempo
    const now = new Date();
    const filteredAttempts = attempts.filter((attempt) => {
      if (!attempt.startedAt) return false;
      const attemptDate = new Date(attempt.startedAt);
      const daysDiff = Math.floor(
        (now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (timeRange === "week") return daysDiff <= 7;
      if (timeRange === "month") return daysDiff <= 30;
      if (timeRange === "year") return daysDiff <= 365;
      return true;
    });

    if (filteredAttempts.length === 0) return null;

    // Agrupar datos según el rango de tiempo
    const groupedData = new Map<string, DataPoint>();

    filteredAttempts.forEach((attempt) => {
      if (!attempt.startedAt) return;
      const attemptDate = new Date(attempt.startedAt);
      let key: string;

      if (timeRange === "week") {
        // Agrupar por día
        key = attemptDate.toLocaleDateString("es-ES", {
          weekday: "short",
        });
      } else if (timeRange === "month") {
        // Agrupar por día del mes
        key = attemptDate.getDate().toString();
      } else {
        // Agrupar por mes
        key = attemptDate.toLocaleDateString("es-ES", {
          month: "short",
        });
      }

      const existing = groupedData.get(key);
      const score = attempt.score || 0;

      if (existing) {
        existing.score += score;
        existing.count += 1;
      } else {
        groupedData.set(key, {
          date: attemptDate,
          score,
          count: 1,
        });
      }
    });

    // Convertir a arrays y ordenar
    const sortedEntries = Array.from(groupedData.entries()).sort(
      ([, a], [, b]) => a.date.getTime() - b.date.getTime(),
    );

    // Limitar a los últimos N puntos
    const maxPoints = timeRange === "week" ? 7 : timeRange === "month" ? 10 : 12;
    const limitedEntries = sortedEntries.slice(-maxPoints);

    // Calcular promedios
    const labels = limitedEntries.map(([key]) => key);
    const avgScores = limitedEntries.map(
      ([, data]) => data.score / data.count,
    );
    const successRates = limitedEntries.map(([key]) => {
      const data = groupedData.get(key)!;
      const successCount = filteredAttempts.filter(
        (a) =>
          a.startedAt &&
          getGroupKey(new Date(a.startedAt), timeRange) === key &&
          a.success,
      ).length;
      return (successCount / data.count) * 100;
    });

    return {
      labels,
      datasets: [
        {
          data: avgScores,
          color: (opacity = 1) => `rgba(91, 80, 122, ${opacity})`, // COLORS.primary
          strokeWidth: 2,
        },
        {
          data: successRates,
          color: (opacity = 1) => `rgba(107, 141, 214, ${opacity})`, // COLORS.success
          strokeWidth: 2,
        },
      ],
    };
  }, [attempts, timeRange]);

  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(91, 80, 122, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: COLORS.white,
    },
    propsForBackgroundLines: {
      strokeDasharray: "", // solid background lines
      stroke: COLORS.separator,
      strokeWidth: 1,
    },
  };

  if (!chartData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Estadísticas mormo</Text>
        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) =>
            onTimeRangeChange(value as "week" | "month" | "year")
          }
          buttons={[
            { value: "week", label: "Semana" },
            { value: "month", label: "Mes" },
            { value: "year", label: "Año" },
          ]}
          style={styles.segmentedButtons}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay datos suficientes para mostrar estadísticas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>

      <SegmentedButtons
        value={timeRange}
        onValueChange={(value) =>
          onTimeRangeChange(value as "week" | "month" | "year")
        }
        buttons={[
          { value: "week", label: "Semana" },
          { value: "month", label: "Mes" },
          { value: "year", label: "Año" },
        ]}
        style={styles.segmentedButtons}
      />

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          fromZero={true}
        />
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.primary }]}
          />
          <Text style={styles.legendText}>Puntuación promedio</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.success }]}
          />
          <Text style={styles.legendText}>Tasa de éxito (%)</Text>
        </View>
      </View>
    </View>
  );
}

function getGroupKey(date: Date, timeRange: "week" | "month" | "year"): string {
  if (timeRange === "week") {
    return date.toLocaleDateString("es-ES", { weekday: "short" });
  } else if (timeRange === "month") {
    return date.getDate().toString();
  } else {
    return date.toLocaleDateString("es-ES", { month: "short" });
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: FONT.semiBold,
    color: COLORS.text,
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  chartScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: COLORS.textLight,
    textAlign: "center",
  },
});
