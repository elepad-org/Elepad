import {
  StatusBar,
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { RefObject, useState } from "react";

import { useGamesTour } from "@/hooks/tours/useGamesTour";
import { useTabContext } from "@/context/TabContext";
import { ActivityIndicator, Text, Icon, Menu, IconButton } from "react-native-paper";
import { Image } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS, LAYOUT } from "@/styles/base";
import { router } from "expo-router";
import HistoryScreen from "../history";
import { ExpandableFAB } from "@/components/shared/ExpandableFAB";
import type { ImageSourcePropType } from "react-native";
import memoryImage from "@/assets/images/memory2.png";
import netImage from "@/assets/images/net2.png";
import sudokuImage from "@/assets/images/sudoku2.png";
import focusImage from "@/assets/images/focus2.png";

interface GameCardProps {
  emoji?: string;
  iconName?: string;
  imageName?: string;
  title: string;
  description: string;
  onPlay: () => void;
  onDetails: () => void;
  contentRef?: RefObject<View | null>;
  playButtonRef?: RefObject<View | null>;
}

const GAME_IMAGES: Record<string, ImageSourcePropType> = {
  memory: memoryImage,
  logic: netImage,
  sudoku: sudokuImage,
  focus: focusImage,
};

function GameCard({
  emoji,
  iconName,
  imageName,
  title,
  description,

  onPlay,
  onDetails,
  contentRef,
  playButtonRef,
}: GameCardProps) {
  return (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={onDetails}
      activeOpacity={0.7}
    >
      <View style={styles.gameCardContent}>
        <View style={styles.gameIconContainer}>
          {imageName ? (
            <Image
              source={GAME_IMAGES[imageName]}
              style={{ width: 36, height: 36, resizeMode: "contain" }}
            />
          ) : iconName ? (
            <Icon source={iconName} size={32} color={COLORS.primary} />
          ) : (
            <Text style={styles.gameEmoji}>{emoji}</Text>
          )}
        </View>

        <View style={styles.gameInfo} ref={contentRef}>
          <Text style={styles.gameTitle}>{title}</Text>
          <Text style={styles.gameDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlay}
          activeOpacity={0.7}
          ref={playButtonRef}
        >
          <Icon source="play" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity >
  );
}

export default function JuegosScreen() {
  const { loading, userElepad } = useAuth();
  const { activeTab } = useTabContext();

  // --- Tour Setup ---
  const isElder = userElepad?.elder === true;

  const { headerRef, shopRef, historyRef, shopFabRef, historyFabRef, gamesListRef, gameDetailsRef, gamePlayRef } = useGamesTour({
    activeTab,
    loading,
    isElder,
  });

  const [actionsMenuVisible, setActionsMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator />
      </View>
    );
  }


  // Si es ayudante, mostrar las estadísticas dentro de las tabs
  if (!isElder) {
    return <HistoryScreen activeTab={activeTab} />;
  }

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={[
          STYLES.contentContainer,
          { paddingBottom: LAYOUT.bottomNavHeight },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Header */}
          <View style={styles.header}>
            <View ref={headerRef}>
              <Text style={STYLES.superHeading}>Juegos</Text>
            </View>
            <Menu
              key={actionsMenuVisible ? "open" : "closed"}
              visible={actionsMenuVisible}
              onDismiss={() => setActionsMenuVisible(false)}
              contentStyle={styles.menuContent}
              style={{ alignSelf: "flex-end", marginRight: -4, marginTop: -8 }}
              anchor={
                <View style={styles.menuAnchorRow}>
                  <View ref={shopRef} collapsable={false} style={styles.measureTarget} />
                  <View ref={historyRef} collapsable={false} style={[styles.measureTarget, { top: 14 }]} />
                  <IconButton
                    icon="dots-horizontal"
                    size={22}
                    iconColor={COLORS.primary}
                    style={{ margin: 0 }}
                    onPress={() => {
                      setActionsMenuVisible(true);
                    }}
                  />
                </View>
              }
            >
              <Menu.Item
                leadingIcon="store"
                onPress={() => {
                  setActionsMenuVisible(false);
                  router.push("/shop");
                }}
                title="Tienda"
              />
              <Menu.Item
                leadingIcon="history"
                onPress={() => {
                  setActionsMenuVisible(false);
                  router.navigate("/history");
                }}
                title="Historial"
              />
            </Menu>
          </View>

          {/* Games List */}
          <View style={styles.gamesContainer} ref={gamesListRef}>
            <GameCard
              imageName="memory"
              title="Memoria"
              description="Encuentra parejas de cartas y entrena tu memoria"
              onPlay={() => router.push("/memory-game")}
              onDetails={() => router.push("/game-detail/memory")}
              contentRef={gameDetailsRef}
              playButtonRef={gamePlayRef}
            />

            <GameCard
              imageName="logic"
              title="NET"
              description="Conecta la red girando las piezas"
              onPlay={() => router.push("/net-game")}
              onDetails={() => router.push("/game-detail/net")}
            />

            <GameCard
              imageName="sudoku"
              title="Sudoku"
              description="Completa el tablero con números del 1 al 9"
              onPlay={() => router.push("/sudoku-game")}
              onDetails={() => router.push("/game-detail/sudoku")}
            />

            <GameCard
              imageName="focus"
              title="Focus"
              description="Selecciona el color indicado por la palabra."
              onPlay={() => router.push("/focus-game")}
              onDetails={() => router.push("/game-detail/focus")}
            />
          </View>
        </View>
      </ScrollView>

      {/* FABs para Tienda e Historial */}
      <ExpandableFAB
        ref={shopFabRef}
        label="Tienda"
        icon="store"
        onPress={() => router.push("/shop")}
        bottom={LAYOUT.bottomNavHeight + 86}
        right={16}
        autoCollapseDelay={5000}
      />

      <ExpandableFAB
        ref={historyFabRef}
        label="Historial"
        icon="history"
        onPress={() => router.navigate("/history")}
        bottom={LAYOUT.bottomNavHeight + 16}
        right={16}
        autoCollapseDelay={5000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  menuContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: 150,
  },
  menuAnchorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  measureTarget: {
    position: "absolute",
    width: 1,
    height: 1,
    right: 0,
    top: 0,
  },
  gamesContainer: {
    width: "100%",
    gap: 12,
  },
  gameCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.card,
  },
  gameCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  gameEmoji: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  comingSoonCard: {
    marginTop: 24,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    ...SHADOWS.card,
  },
  comingSoonEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
