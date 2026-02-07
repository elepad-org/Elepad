import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "@/styles/base";
import { formatInUserTimezone } from "@/lib/timezoneHelpers";

interface Attempt {
  id: string;
  memoryPuzzleId?: string;
  logicPuzzleId?: string;
  sudokuPuzzleId?: string;
  isFocusGame?: boolean;
  success?: boolean;
  score?: number;
  startedAt?: string;
  durationMs?: number;
}

type Props = {
  attempt: Attempt;
  gameType: string;
  userTimezone?: string;
  viewRef?: React.Ref<View>;
};

export default function AttemptCard({
  attempt,
  gameType,
  userTimezone,
  viewRef,
}: Props) {
  // Mapeo de colores por tipo de juego
  const gameColors: Record<string, string> = {
    "Memoria": "#6B8DD6", // Azul suave
    "NET": "#8E7CC3", // Púrpura
    "Sudoku": "#F4A460", // Naranja suave
    "Focus": "#66BB6A", // Verde
  };

  const statusColor = COLORS.secondary;
  const gameColor = gameColors[gameType] || COLORS.primary;
  const score = attempt?.score ?? "-";

  let dateFormatted = "-";
  if (attempt?.startedAt) {
    dateFormatted = formatInUserTimezone(
      attempt.startedAt,
      "dd/MM - HH:mm",
      userTimezone
    );
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
      ref={viewRef}
    >
      <View style={[styles.statusStrip, { backgroundColor: gameColor }]} />
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

const styles = StyleSheet.create({
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
