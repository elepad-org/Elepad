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

  // Usar stats personalizados si se proveen, sino usar los predeterminados
  const displayStats = customStats || [
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

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
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
              <View style={styles.resultStats}>
                {displayStats.map((stat, index) => (
                  <View key={index} style={styles.resultStat}>
                    <Text style={styles.resultIcon}>{stat.icon}</Text>
                    <Text style={styles.resultLabel}>{stat.label}</Text>
                    <Text style={styles.resultValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
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
    justifyContent: "space-around",
    gap: 12,
  },
  resultStat: {
    flex: 1,
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
    gap: 8,
  },
  dialogButton: {
    flex: 1,
  },
});
