import React from "react";
import { View, StyleSheet } from "react-native";
import { Portal, Dialog, Button, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

export interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  points: number;
}

export interface GameCompletedModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPlayAgain: () => void;
  onBackToGames: () => void;
  success: boolean;
  score?: number | null;
  moves?: number | null;
  time?: number | null;
  achievements?: Achievement[];
  customStats?: Array<{
    icon: string;
    label: string;
    value: string | number;
  }>;
}

/**
 * Modal reutilizable para mostrar resultados de juegos completados
 * Incluye estadísticas, logros desbloqueados y acciones
 */
export function GameCompletedModal({
  visible,
  onDismiss,
  onPlayAgain,
  onBackToGames,
  success,
  score,
  moves,
  time,
  achievements = [],
  customStats,
}: GameCompletedModalProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Construir estadísticas predeterminadas basadas en props
  const defaultStats = [
    ...(score !== undefined && score !== null
      ? [
          {
            icon: "🎯",
            label: "Puntaje",
            value: score,
          },
        ]
      : []),
    ...(moves !== undefined && moves !== null
      ? [
          {
            icon: "🔢",
            label: "Movimientos",
            value: moves,
          },
        ]
      : []),
    ...(time !== undefined && time !== null
      ? [
          {
            icon: "⏱️",
            label: "Tiempo",
            value: formatTime(time),
          },
        ]
      : []),
  ];

  // Combinar predeterminadas con personalizadas
  const displayStats = [...defaultStats, ...(customStats || [])];

  // Separar el puntaje si hay muchas estadísticas (para destacarlo)
  let mainStat = null;
  let secondaryStats = displayStats;

  if (displayStats.length > 3) {
    const scoreIndex = displayStats.findIndex((s) => s.label === "Puntaje");
    if (scoreIndex !== -1) {
      mainStat = displayStats[scoreIndex];
      secondaryStats = displayStats.filter((_, i) => i !== scoreIndex);
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        dismissable={false}
        style={styles.dialog}
      >
        <Dialog.Title style={styles.dialogTitle}>
          {success ? "¡Felicitaciones! 🎉" : "Inténtalo de nuevo 💪"}
        </Dialog.Title>

        <Dialog.Content>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {success
                ? "¡Has completado el juego exitosamente!"
                : "Inténtalo de nuevo, puedes hacerlo mejor."}
            </Text>

            {/* Estadísticas del juego */}
            {displayStats.length > 0 && (
              <>
                {/* Estadística destacada (Score) si hay más de 3 */}
                {mainStat && (
                  <View style={styles.mainResultStat}>
                    <Text style={styles.mainResultIcon}>{mainStat.icon}</Text>
                    <View>
                      <Text style={styles.mainResultLabel}>
                        {mainStat.label}
                      </Text>
                      <Text style={styles.mainResultValue}>
                        {mainStat.value}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.resultStats}>
                  {secondaryStats.map((stat, index) => (
                    <View key={index} style={styles.resultStat}>
                      <Text style={styles.resultIcon}>{stat.icon}</Text>
                      <Text style={styles.resultLabel}>{stat.label}</Text>
                      <Text style={styles.resultValue}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Logros desbloqueados */}
            {achievements && achievements.length > 0 && (
              <View style={styles.achievementsSection}>
                <Text style={styles.achievementsSectionTitle}>
                  🏆 Logros Desbloqueados
                </Text>
                <View style={styles.achievementsContainer}>
                  {achievements.map((achievement) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                      <Text style={styles.achievementIcon}>
                        {achievement.icon || "🏆"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.achievementTitle}>
                          {achievement.title}
                        </Text>
                        {achievement.description && (
                          <Text style={styles.achievementDescription}>
                            {achievement.description}
                          </Text>
                        )}
                        <Text style={styles.achievementPoints}>
                          +{achievement.points} pts
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Dialog.Content>

        <Dialog.Actions style={styles.dialogActions}>
          <Button
            mode="outlined"
            onPress={onBackToGames}
            style={styles.dialogButton}
          >
            Volver a Juegos
          </Button>
          <Button
            mode="contained"
            onPress={onPlayAgain}
            style={styles.dialogButton}
            buttonColor={COLORS.primary}
          >
            Jugar de Nuevo
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: COLORS.background,
    width: "90%",
    alignSelf: "center",
    borderRadius: 16,
    paddingVertical: 14,
  },
  dialogTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  resultsContainer: {
    gap: 20,
  },
  resultsText: {
    textAlign: "center",
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  resultStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 12,
  },
  resultStat: {
    flex: 1,
    minWidth: 90,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
  },
  resultIcon: {
    fontSize: 32,
  },
  resultLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  mainResultStat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + "40", // 40 = 25% opacidad hex
  },
  mainResultIcon: {
    fontSize: 42,
  },
  mainResultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainResultValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  achievementsSection: {
    marginTop: 8,
  },
  achievementsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  achievementDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  achievementPoints: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    flexDirection: "column",
  },
  dialogButton: {
    width: "100%",
    borderRadius: 12,
  },
});
