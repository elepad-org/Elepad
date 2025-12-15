import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, View, StyleSheet } from "react-native";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { AttentionGame } from "@/components/AttentionGame";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";

export default function AttentionGameScreen() {
  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View
        style={[
          STYLES.contentContainer,
          { paddingBottom: LAYOUT.bottomNavHeight },
        ]}
      >
        <Text variant="titleLarge" style={{ marginBottom: 12 }}>
          Atención
        </Text>
        <Text style={{ marginBottom: 12, color: COLORS.textSecondary }}>
          Selecciona el color que indica la palabra (no el color del texto).
        </Text>

        <AttentionGame
          rounds={10}
          onFinish={(score) => {
            console.log("Juego terminado", score);
            //router.back();
          }}
        />

        <View style={{ marginTop: 12 }}>
          <Button mode="outlined" onPress={() => router.back()}>
            Volver
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
