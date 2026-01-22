import React, { useEffect } from "react";
import { View, StyleSheet, Alert, FlatList, Image } from "react-native";
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
import { COLORS, SHADOWS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/shared/BackButton";
import Reanimated, { ZoomIn } from "react-native-reanimated";

export default function ShopScreen() {
  const router = useRouter();
  const { userElepad: user } = useAuth();
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);

  // Helpers to normalize data
  const normalizeData = (data: any) => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    return "data" in data ? data.data : data;
  };

  // Queries
  const balanceResponse = useGetShopBalance();
  const balanceData = normalizeData(balanceResponse.data);
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

  // Mutation
  const { mutate: buyItem, isPending: isBuying } = usePostShopBuy({
    mutation: {
      onSuccess: () => {
        Alert.alert("¡Éxito!", "Has comprado el artículo correctamente.");
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

  const isOwned = (itemId: string) => {
    return inventoryData?.some((inv: any) => inv.itemId === itemId);
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
                  { backgroundColor: COLORS.purple.primary + "15" },
                ]}
              >
                <Text style={{ fontSize: 32 }}>🎁</Text>
              </View>
            )}

            {owned && (
              <View style={styles.ownedOverlay}>
                <Text style={{ fontSize: 24 }}>✓</Text>
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
              <>
                <Text style={{ fontSize: 16 }}>💎</Text>
                <Text style={styles.priceText}>{item.cost}</Text>
              </>
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
          <Chip
            icon={() => <Text style={{ fontSize: 16 }}>💎</Text>}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {balanceData?.pointsBalance ?? 0} Puntos
          </Chip>
          <Text style={styles.subtitleText}>¡Canjea tus premios!</Text>
        </View>
      </View>

      <FlatList
        data={itemsData}
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
                <Text style={{ fontSize: 24 }}>💎</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: COLORS.primary,
                    marginLeft: 8,
                  }}
                >
                  {selectedItem.cost}
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
    fontWeight: "bold",
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
    fontWeight: "700",
    fontSize: 15,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
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
    backgroundColor: COLORS.backgroundSecondary,
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
  ownedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.success,
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
    fontWeight: "600",
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
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 4,
  },
  ownedText: {
    fontSize: 13,
    fontWeight: "600",
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
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
    textAlign: "center",
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalItemPreview: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.backgroundSecondary,
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
    fontWeight: "500",
  },
});
