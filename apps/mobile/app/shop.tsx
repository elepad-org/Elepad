import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import {
  Text,
  ActivityIndicator,
  Button,
  Portal,
  Modal,
  Chip,
  Avatar,
} from "react-native-paper";
import { useRouter } from "expo-router";
import {
  useGetShopItems,
  useGetShopBalance,
  usePostShopBuy,
  useGetShopInventory,
  usePostShopEquip,
  useGetFamilyGroupIdGroupMembers,
  useGetShopItemsItemIdOwnership,
} from "@elepad/api-client";
import { COLORS, SHADOWS, FONT } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/shared/BackButton";
import Reanimated, { ZoomIn } from "react-native-reanimated";
import { useToast } from "@/components/shared/Toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DropdownSelect from "@/components/shared/DropdownSelect";

export default function ShopScreen() {
  const router = useRouter();
  const { userElepad: user, refreshUserElepad } = useAuth();
  const { showToast } = useToast();
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string;
    title: string;
    cost: number;
    type?: string;
    assetUrl?: string;
  } | null>(null);
  const [activeFilter, setActiveFilter] = React.useState("Todos");
  const [buyForOthers, setBuyForOthers] = React.useState(false);
  const [recipientUserId, setRecipientUserId] = React.useState<string>("");

  // Helpers to normalize data
  const normalizeData = (data: unknown) => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as { data: unknown }).data;
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

  // Obtener miembros del grupo familiar
  const groupMembersResponse = useGetFamilyGroupIdGroupMembers(
    user?.groupId ?? "",
    {
      query: { enabled: !!user?.groupId },
    },
  );
  const groupMembersData = normalizeData(groupMembersResponse.data) as
    | {
        owner: {
          id: string;
          displayName: string;
          avatarUrl: string | null;
          elder: boolean;
          activeFrameUrl: string | null;
        };
        members: Array<{
          id: string;
          displayName: string;
          avatarUrl: string | null;
          elder: boolean;
          activeFrameUrl: string | null;
        }>;
      }
    | undefined;

  // Filtrar miembros que NO sean abuelos
  const nonElderMembers = React.useMemo(() => {
    if (!groupMembersData) return [];
    const allMembers = [...groupMembersData.members];
    // Agregar owner si no es elder (aunque normalmente sí lo es)
    if (!groupMembersData.owner.elder) {
      allMembers.push(groupMembersData.owner);
    }
    return allMembers.filter((m) => !m.elder);
  }, [groupMembersData]);

  // Obtener quiénes tienen el item seleccionado
  const ownershipResponse = useGetShopItemsItemIdOwnership(
    selectedItem?.id ?? "",
    {
      query: { enabled: !!selectedItem?.id },
    }
  );
  const ownershipData = normalizeData(ownershipResponse.data) as
    | { itemId: string; ownerUserIds: string[] }
    | undefined;

  // Filtrar miembros que NO tienen el item seleccionado (para regalos)
  const availableRecipients = React.useMemo(() => {
    if (!selectedItem || !ownershipData) return nonElderMembers;
    
    const ownerIds = new Set(ownershipData.ownerUserIds);
    return nonElderMembers.filter(member => !ownerIds.has(member.id));
  }, [nonElderMembers, selectedItem, ownershipData]);

  // Removed duplicate isOwned declaration

  /* Helper definitions moved up */
  const castInventory = inventoryData as
    | Array<{ itemId: string; equipped?: boolean }>
    | undefined;

  const isOwned = (itemId: string) => {
    return (
      Array.isArray(castInventory) &&
      castInventory.some((inv) => inv.itemId === itemId)
    );
  };

  const isEquipped = (itemId: string) => {
    return (
      Array.isArray(castInventory) &&
      castInventory.some((inv) => inv.itemId === itemId && inv.equipped)
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
    itemsData.forEach((item) => {
      const typedItem = item as { type?: string };
      if (typedItem.type) types.add(typedItem.type);
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
        const recipientName = nonElderMembers.find(
          (m) => m.id === recipientUserId,
        )?.displayName;
        const message = buyForOthers && recipientName
          ? `¡Regalo comprado con éxito para ${recipientName}!`
          : "¡Compra realizada con éxito!";
        showToast({ message, type: "success" });
        setSelectedItem(null);
        setBuyForOthers(false);
        setRecipientUserId("");
        refetchBalance(); // Update points
        refetchInventory(); // Update inventory
      },
      onError: (error: Error) => {
        const message =
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "No se pudo realizar la compra.";
        Alert.alert("Error", message);
      },
    },
  });

  const { mutate: equipItem, isPending: isEquipping } = usePostShopEquip({
    mutation: {
      onSuccess: () => {
        showToast({ message: "¡Marco equipado con éxito!", type: "success" });
        setSelectedItem(null);
        refetchInventory();
        refreshUserElepad(); // Refresh user to update active frame
      },
      onError: (error: Error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "No se pudo equipar el item.";
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
    
    // Validar que si está en modo "comprar para otros", se haya seleccionado un destinatario
    if (buyForOthers && !recipientUserId) {
      Alert.alert("Error", "Por favor selecciona un destinatario.");
      return;
    }
    
    buyItem({
      data: {
        itemId: selectedItem.id,
        recipientUserId: buyForOthers ? recipientUserId : undefined,
      },
    });
  };

  const handleEquip = () => {
    if (!selectedItem) return;
    equipItem({ data: { itemId: selectedItem.id } });
  };

  const handleDismissModal = () => {
    setSelectedItem(null);
    setBuyForOthers(false);
    setRecipientUserId("");
  };

  /* Redundant declarations removed */

  const renderItem = ({
    item,
    index,
  }: {
    item: {
      id: string;
      type?: string;
      title: string;
      cost: number;
      assetUrl?: string;
    };
    index: number;
  }) => {
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
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => {
            if (owned) {
              if (item.type === "frame") {
                setSelectedItem(item);
              }
            } else {
              setSelectedItem(item);
            }
          }}
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
                contentFit="contain"
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
                  name="check-circle"
                  size={18}
                  color={COLORS.primary}
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
                style={({ pressed }) => [
                  styles.filterChip,
                  activeFilter === item && styles.filterChipActive,
                  pressed && { opacity: 0.7 },
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
          onDismiss={handleDismissModal}
          contentContainerStyle={styles.modalContent}
        >
          {selectedItem && (
            <View style={styles.modalInner}>
              {/* Modal Header/Preview */}
              <LinearGradient
                colors={[COLORS.primary + "15", COLORS.white]}
                style={styles.modalHeader}
              >
                <View style={styles.modalPreviewContainer}>
                  {selectedItem.type === "frame" && user ? (
                    <View
                      style={{
                        position: "relative",
                        width: 140,
                        height: 140,
                        // Ensure wrapper centers content if needed, though pure View works
                      }}
                    >
                      {/* Base Avatar */}
                      <View
                        style={{
                          width: 140,
                          height: 140,
                          borderRadius: 70,
                          overflow: "hidden",
                        }}
                      >
                        {user.avatarUrl ? (
                          <Avatar.Image
                            size={140}
                            source={{ uri: user.avatarUrl }}
                          />
                        ) : (
                          <Avatar.Text
                            size={140}
                            label={(user.displayName || user.email || "U")
                              .substring(0, 2)
                              .toUpperCase()}
                          />
                        )}
                      </View>

                      {/* Frame Overlay */}
                      {selectedItem.assetUrl && (
                        <View
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            width: 140 * 1.4,
                            height: 140 * 1.4,
                            top: -140 * 0.2, // ~ -28
                            left: -140 * 0.2, // ~ -28
                            zIndex: 10,
                          }}
                        >
                          <Image
                            source={{ uri: selectedItem.assetUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="contain"
                          />
                        </View>
                      )}
                    </View>
                  ) : selectedItem.assetUrl ? (
                    <Image
                      source={{ uri: selectedItem.assetUrl }}
                      style={styles.modalImage}
                      contentFit="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 60 }}>🎁</Text>
                  )}
                </View>
                {selectedItem.type && (
                  <View
                    style={[
                      styles.modalTypeBadge,
                      { backgroundColor: getPastelColor(selectedItem.type) },
                    ]}
                  >
                    <Text style={styles.modalTypeBadgeText}>
                      {selectedItem.type}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                
                {!isOwned(selectedItem.id) && (
                  <>
                    {/* Costo del canje */}
                    <View style={styles.modalCostContainer}>
                      <Text style={styles.modalCostLabel}>Costo del canje</Text>
                      <Text style={styles.modalCostValue}>
                        {selectedItem.cost} Puntos
                      </Text>
                    </View>

                    {/* Point Info */}
                    <View style={styles.pointsInfoRow}>
                      <View style={styles.pointsInfoItem}>
                        <Text style={styles.pointsInfoLabel}>Tus puntos</Text>
                        <Text style={styles.pointsInfoValue}>
                          {balanceData?.pointsBalance ?? 0}
                        </Text>
                      </View>
                      <View style={styles.pointsInfoDivider} />
                      <View style={styles.pointsInfoItem}>
                        <Text style={styles.pointsInfoLabel}>Restantes</Text>
                        <Text
                          style={[
                            styles.pointsInfoValue,
                            (balanceData?.pointsBalance ?? 0) <
                              selectedItem.cost && styles.pointsNegative,
                          ]}
                        >
                          {Math.max(
                            0,
                            (balanceData?.pointsBalance ?? 0) - selectedItem.cost,
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Botones para seleccionar modo de compra */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setBuyForOthers(false);
                          setRecipientUserId("");
                        }}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: !buyForOthers
                              ? COLORS.primary
                              : COLORS.border,
                            backgroundColor: !buyForOthers
                              ? COLORS.primary + "15"
                              : "transparent",
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            fontFamily: FONT.semiBold,
                            fontSize: 13,
                            color: !buyForOthers
                              ? COLORS.primary
                              : COLORS.textSecondary,
                          }}
                        >
                          Para mí
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setBuyForOthers(true)}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: buyForOthers
                              ? COLORS.primary
                              : COLORS.border,
                            backgroundColor: buyForOthers
                              ? COLORS.primary + "15"
                              : "transparent",
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                        disabled={availableRecipients.length === 0}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            fontFamily: FONT.semiBold,
                            fontSize: 13,
                            color: buyForOthers
                              ? COLORS.primary
                              : availableRecipients.length === 0
                                ? COLORS.textSecondary + "50"
                                : COLORS.textSecondary,
                          }}
                        >
                          Regalar
                        </Text>
                      </Pressable>
                    </View>

                    {/* Selector de destinatario si está en modo regalo */}
                    {buyForOthers && (
                      <View style={{ marginBottom: 16 }}>
                        <DropdownSelect
                          label="Destinatario"
                          value={recipientUserId}
                          options={availableRecipients.map((member) => ({
                            key: member.id,
                            label: member.displayName,
                            avatarUrl: member.avatarUrl || null,
                            frameUrl: member.activeFrameUrl || null,
                          }))}
                          onSelect={(value) => setRecipientUserId(value)}
                          placeholder="Selecciona un familiar"
                          showLabel={true}
                        />
                      </View>
                    )}
                  </>
                )}

                <View style={styles.modalActions}>
                  <Button
                    mode="text"
                    onPress={handleDismissModal}
                    style={styles.modalCancelBtn}
                    textColor={COLORS.textSecondary}
                    labelStyle={{ fontFamily: FONT.semiBold }}
                  >
                    Quizás luego
                  </Button>

                  {isOwned(selectedItem.id) ? (
                    selectedItem.type === "frame" ? (
                      <Pressable
                        onPress={handleEquip}
                        disabled={isEquipping || isEquipped(selectedItem.id)}
                        style={({ pressed }) => [
                          styles.modalConfirmBtn,
                          {
                            backgroundColor: COLORS.primary,
                            opacity:
                              pressed ||
                              isEquipping ||
                              isEquipped(selectedItem.id)
                                ? 0.7
                                : 1,
                          },
                        ]}
                      >
                        {isEquipping ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <Text
                            style={{
                              color: COLORS.white,
                              fontFamily: FONT.bold,
                              fontSize: 16,
                              textAlign: "center",
                            }}
                          >
                            {isEquipped(selectedItem.id)
                              ? "Equipado"
                              : "Usar Marco"}
                          </Text>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        disabled={true}
                        style={[
                          styles.modalConfirmBtn,
                          {
                            backgroundColor: COLORS.primary,
                            opacity: 0.7,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: COLORS.white,
                            fontFamily: FONT.bold,
                            fontSize: 16,
                            textAlign: "center",
                          }}
                        >
                          Ya lo tienes
                        </Text>
                      </Pressable>
                    )
                  ) : (
                    <Pressable
                      onPress={handleBuy}
                      disabled={
                        isBuying ||
                        (balanceData?.pointsBalance ?? 0) < selectedItem.cost ||
                        (buyForOthers && !recipientUserId)
                      }
                      style={({ pressed }) => [
                        styles.modalConfirmBtn,
                        {
                          backgroundColor: COLORS.primary,
                          opacity:
                            pressed ||
                            isBuying ||
                            (balanceData?.pointsBalance ?? 0) <
                              selectedItem.cost ||
                            (buyForOthers && !recipientUserId)
                              ? 0.7
                              : 1,
                        },
                      ]}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text
                          style={{
                            color: COLORS.white,
                            fontFamily: FONT.bold,
                            fontSize: 16,
                            textAlign: "center",
                          }}
                        >
                          {buyForOthers ? "Regalar" : "Canjear"}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>

                {(balanceData?.pointsBalance ?? 0) < selectedItem.cost &&
                  !isOwned(selectedItem.id) && (
                    <View style={styles.errorBanner}>
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={16}
                        color={COLORS.error}
                      />
                      <Text style={styles.insufficientPoints}>
                        No tienes suficientes puntos para este item.
                      </Text>
                    </View>
                  )}
              </View>
            </View>
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
    backgroundColor: COLORS.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.light,
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
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
  },
  ownedText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: COLORS.primary,
  },
  modalContent: {
    padding: 0,
    margin: 24,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  modalInner: {
    borderRadius: 28,
    overflow: "hidden",
  },
  modalHeader: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  modalPreviewContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  modalImage: {
    width: 100,
    height: 100,
  },
  modalTypeBadge: {
    position: "absolute",
    top: 20,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...SHADOWS.light,
  },
  modalTypeBadgeText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: "rgba(0,0,0,0.6)",
    textTransform: "uppercase",
  },
  modalBody: {
    padding: 24,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalCostContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCostLabel: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  modalCostValue: {
    fontSize: 22,
    fontFamily: FONT.bold,
    color: COLORS.primary,
  },
  pointsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  pointsInfoItem: {
    alignItems: "center",
  },
  pointsInfoLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  pointsInfoValue: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
  },
  pointsInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  pointsNegative: {
    color: COLORS.red,
  },
  modalActions: {
    flexDirection: "column",
    gap: 12,
  },
  modalConfirmBtn: {
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
  },
  modalCancelBtn: {
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.red + "10",
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  insufficientPoints: {
    color: COLORS.red,
    fontSize: 13,
    fontFamily: FONT.semiBold,
    textAlign: "center",
  },
});
