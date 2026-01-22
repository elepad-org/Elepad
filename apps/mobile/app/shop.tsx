import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Button,
  Portal,
  Modal,
  Chip,
} from "react-native-paper";
import { useRouter } from "expo-router";
import {
  useGetShopItems,
  useGetShopBalance,
  usePostShopBuy,
  useGetShopInventory,
} from "@elepad/api-client";
import { COLORS, SHADOWS, FONT } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/shared/BackButton";
import Reanimated, { ZoomIn } from "react-native-reanimated";
import { useToast } from "@/components/shared/Toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ShopScreen() {
  const router = useRouter();
  const { userElepad: user } = useAuth();
  const { showToast } = useToast();
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string;
    title: string;
    cost: number;
    type?: string;
    assetUrl?: string;
  } | null>(null);
  const [activeFilter, setActiveFilter] = React.useState("Todos");

  // Helpers to normalize data
  const normalizeData = (data: unknown) => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as { data: any }).data;
    }
    return data;
  };

  // Queries
  const balanceResponse = useGetShopBalance();
  const balanceData = normalizeData(balanceResponse.data) as
    | { pointsBalance: number }
    | undefined;
  const refetchBalance = balanceResponse.refetch;

  const itemsResponse = useGetShopItems();
  const itemsDataRaw = normalizeData(itemsResponse.data);
  // Ensure itemsData is an array
  const itemsData = Array.isArray(itemsDataRaw) ? itemsDataRaw : [];

  const isLoadingItems = itemsResponse.isLoading;
  const itemsError = itemsResponse.error;

  const inventoryResponse = useGetShopInventory();
  const inventoryData = normalizeData(inventoryResponse.data);
  const refetchInventory = inventoryResponse.refetch;

  const isOwned = (itemId: string) => {
    return (
      Array.isArray(inventoryData) &&
      (inventoryData as Array<{ itemId: string }>).some(
        (inv) => inv.itemId === itemId,
      )
    );
  };

  // Sorting: Owned items at the end
  const sortedItems = React.useMemo(() => {
    if (!Array.isArray(itemsData)) return [];
    return [...itemsData].sort((a, b) => {
      const aOwned = isOwned(a.id);
      const bOwned = isOwned(b.id);
      if (aOwned === bOwned) return 0;
      return aOwned ? 1 : -1;
    });
  }, [itemsData, inventoryData]);

  // Available categories
  const categories = React.useMemo(() => {
    const types = new Set<string>();
    types.add("Todos");
    itemsData.forEach((item: any) => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types);
  }, [itemsData]);

  // Filtering
  const filteredItems = React.useMemo(() => {
    if (activeFilter === "Todos") return sortedItems;
    return sortedItems.filter((item) => item.type === activeFilter);
  }, [sortedItems, activeFilter]);

  const TYPE_COLORS: Record<string, string> = {
    sticker: "#8CC0FF", // Soft Pastel Blue
    Sticker: "#8CC0FF",
    frame: "#9AD6AA", // Soft Pastel Green
    Frame: "#9AD6AA",
    animation: "#FFE082", // Soft Pastel Yellow
    Animation: "#FFE082",
    other: "#FF9999", // Soft Pastel Red
    Other: "#FF9999",
  };

  const getPastelColor = (type: string) => {
    return TYPE_COLORS[type] || "#E5E5EA";
  };

  // Mutation
  const { mutate: buyItem, isPending: isBuying } = usePostShopBuy({
    mutation: {
      onSuccess: () => {
        showToast({ message: "¡Compra realizada con éxito!", type: "success" });
        setSelectedItem(null);
        refetchBalance(); // Update points
        refetchInventory(); // Update inventory
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.error || "No se pudo realizar la compra.";
        Alert.alert("Error", message);
      },
    },
  });

  // Verify elder permission
  useEffect(() => {
    if (user && !user.elder) {
      Alert.alert(
        "Acceso Restringido",
        "Solo los abuelos pueden acceder a la tienda.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }, [user]);

  const handleBuy = () => {
    if (!selectedItem) return;
    buyItem({ data: { itemId: selectedItem.id } });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const owned = isOwned(item.id);

    return (
      <Reanimated.View
        entering={ZoomIn.delay(index * 50).springify()}
        style={{ width: "48%", marginBottom: 16 }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.shopCard,
            owned && styles.ownedCard,
            pressed && styles.pressedCard,
          ]}
          onPress={() => !owned && setSelectedItem(item)}
        >
          <View style={styles.imageContainer}>
            {item.type && (
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getPastelColor(item.type) },
                ]}
              >
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            )}
            {item.assetUrl ? (
              <Image
                source={{ uri: item.assetUrl }}
                style={styles.itemImage}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  { backgroundColor: COLORS.purple.light + "50" },
                ]}
              >
                <Text style={{ fontSize: 32 }}>🎁</Text>
              </View>
            )}

            {owned && (
              <View style={styles.ownedOverlay}>
                <MaterialCommunityIcons
                  name="check-bold"
                  size={20}
                  color={COLORS.white}
                />
              </View>
            )}
          </View>

          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.priceContainer}>
            {owned ? (
              <Text style={styles.ownedText}>Comprado</Text>
            ) : (
              <Text style={styles.priceText}>{item.cost} Puntos</Text>
            )}
          </View>
        </Pressable>
      </Reanimated.View>
    );
  };

  if (isLoadingItems) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (itemsError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <BackButton size={28} />
            <Text style={styles.headerTitle}>Tienda</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error cargando la tienda.</Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            buttonColor={COLORS.primary}
          >
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Manual Header matching Notifications */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <BackButton size={28} />
          <Text style={styles.headerTitle}>Tienda de Puntos</Text>
        </View>

        <View style={styles.headerActions}>
          <Chip style={styles.chip} textStyle={styles.chipText}>
            {balanceData?.pointsBalance ?? 0} Puntos
          </Chip>
          <Text style={styles.subtitleText}>¡Canjea tus premios!</Text>
        </View>

        {/* Filter Bar */}
        <View style={{ marginTop: 12 }}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setActiveFilter(item)}
                style={[
                  styles.filterChip,
                  activeFilter === item && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === item && styles.filterChipTextActive,
                  ]}
                >
                  {item === "Todos"
                    ? item
                    : item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      {/* Buy Modal */}
      <Portal>
        <Modal
          visible={!!selectedItem}
          onDismiss={() => setSelectedItem(null)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedItem && (
            <>
              <Text style={styles.modalTitle}>Confirmar Compra</Text>
              <Text style={styles.modalDescription}>
                ¿Quieres canjear{" "}
                <Text style={{ fontWeight: "bold" }}>
                  "{selectedItem.title}"
                </Text>{" "}
                por?
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: FONT.bold,
                    color: COLORS.primary,
                  }}
                >
                  {selectedItem.cost} Puntos
                </Text>
              </View>

              <View style={styles.modalItemPreview}>
                {selectedItem.assetUrl ? (
                  <Image
                    source={{ uri: selectedItem.assetUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={{ fontSize: 50 }}>🎁</Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setSelectedItem(null)}
                  style={{
                    flex: 1,
                    marginRight: 8,
                    borderColor: COLORS.primary,
                  }}
                  textColor={COLORS.primary}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleBuy}
                  loading={isBuying}
                  disabled={
                    isBuying ||
                    (balanceData?.pointsBalance ?? 0) < selectedItem.cost
                  }
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    backgroundColor: COLORS.primary,
                  }}
                >
                  Canjear
                </Button>
              </View>
              {(balanceData?.pointsBalance ?? 0) < selectedItem.cost && (
                <Text style={styles.insufficientPoints}>
                  No tienes suficientes puntos.
                </Text>
              )}
            </>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: COLORS.primary + "15",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    color: COLORS.primary,
    fontFamily: FONT.bold,
    fontSize: 15,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONT.medium,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + "15",
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONT.semiBold,
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
    color: COLORS.text,
    fontFamily: FONT.regular,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  shopCard: {
    ...SHADOWS.card,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    width: "100%",
  },
  ownedCard: {
    opacity: 0.8,
    backgroundColor: "#F5F5F5",
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  itemImage: {
    width: "80%",
    height: "80%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    ...SHADOWS.light,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: "rgba(0,0,0,0.6)",
    textTransform: "uppercase",
  },
  ownedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#9AD6AA", // Pastel same as success toast
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: FONT.semiBold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
    height: 40,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: "100%",
  },
  priceText: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: COLORS.text,
  },
  ownedText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: COLORS.success,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    margin: 20,
    borderRadius: 24,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginBottom: 8,
    color: COLORS.text,
    textAlign: "center",
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: FONT.regular,
  },
  modalItemPreview: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...SHADOWS.light,
  },
  modalImage: {
    width: 90,
    height: 90,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  insufficientPoints: {
    color: COLORS.error,
    textAlign: "center",
    marginTop: 16,
    fontFamily: FONT.medium,
  },
});
