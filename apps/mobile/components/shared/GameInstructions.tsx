import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { COLORS } from "@/styles/base";
import { GameInfo } from "@/constants/gamesInfo";

type GameInstructionsProps = {
  gameInfo: GameInfo;
  variant?: "dialog" | "card";
};

export function GameInstructions({
  gameInfo,
  variant = "dialog",
}: GameInstructionsProps) {
  const styles = variant === "dialog" ? dialogStyles : cardStyles;

  return (
    <View style={styles.container}>
      {/* Objetivo del juego */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          🎯 Objetivo del Juego
        </Text>
        <Text variant="bodyMedium" style={styles.text}>
          {gameInfo.objective}
        </Text>
      </View>

      {/* Secciones dinámicas */}
      {gameInfo.sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {section.title}
          </Text>
          {section.content && typeof section.content === "string" ? (
            <Text variant="bodyMedium" style={styles.text}>
              {section.content}
            </Text>
          ) : (
            section.content
          )}
          {section.items && section.items.length > 0 && (
            <View style={styles.listContainer}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <Text variant="bodyMedium" style={styles.bullet}>
                    {item.bullet}
                  </Text>
                  <Text variant="bodyMedium" style={styles.itemText}>
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const dialogStyles = StyleSheet.create({
  container: {
    gap: 4,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  listContainer: {
    gap: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: 8,
    width: 20,
  },
  itemText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 22,
  },
});

const cardStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
  },
  text: {
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  listContainer: {
    gap: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 20,
  },
  itemText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 22,
  },
});
