import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/base";

type Props = {
  attempt: {
    success?: boolean;
    score?: number;
    startedAt?: string;
    durationMs?: number;
    moves?: number;
  };
  gameType: string;
};

export default function AttemptCard({ attempt, gameType }: Props) {
  const isSuccess = attempt?.success;
  const statusColor = isSuccess ? COLORS.success : COLORS.error;
  const score = attempt?.score ?? "-";

  // Formateo de fecha: DD/MM HH:MM
  let dateFormatted = "-";
  if (attempt?.startedAt) {
    const dateObj = new Date(attempt.startedAt);
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    dateFormatted = `${day}/${month} - ${hours}:${minutes}`;
  }

  // Formateo de duración
  let durationFormatted = "-";
  if (attempt?.durationMs) {
    const totalSeconds = Math.floor(attempt.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    durationFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <Card style={[styles.card, { backgroundColor: COLORS.background }]}>
      <View style={styles.rowContainer}>
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
        <View style={styles.contentContainer}>
          {/* Tipo, Fecha y Estado */}
          <View style={styles.leftColumn}>
            <Text variant="titleMedium" style={styles.gameTitle}>
              {gameType}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={14}
                color="#666"
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {dateFormatted}
              </Text>
            </View>
            <Text>{isSuccess ? "Terminada" : "No terminada"}</Text>
          </View>

          {/* Puntos y Tiempo */}
          <View style={styles.rightColumn}>
            <Text
              variant="titleMedium"
              style={[styles.scoreText, { color: statusColor }]}
            >
              Puntos: {score}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={14}
                color="#666"
              />
              <Text variant="bodySmall" style={styles.metaText}>
                {durationFormatted}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    overflow: "hidden",
    elevation: 2,
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    height: 70,
  },
  statusStrip: {
    width: 4,
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  leftColumn: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
  },
  rightColumn: {
    justifyContent: "center",
    alignItems: "flex-end",
    minWidth: 16,
  },
  gameTitle: {
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  scoreText: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#666",
    marginLeft: 4,
  },
});
