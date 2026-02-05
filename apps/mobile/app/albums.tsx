import { useState, useCallback } from "react";
import Animated, { ZoomIn } from "react-native-reanimated";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  StatusBar,
} from "react-native";
import { Text, ActivityIndicator, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { useGetMemories, Album } from "@elepad/api-client";
import CreateAlbumDialog from "@/components/Recuerdos/CreateAlbumDialog";
import AlbumCard from "@/components/shared/AlbumCard";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import { BackButton } from "@/components/shared/BackButton";
import eleEmpthy from "@/assets/images/ele-idea.png";

const unwrapAlbums = (response: unknown): Album[] => {
  let cursor: unknown = response;

  while (cursor !== undefined && cursor !== null) {
    if (Array.isArray(cursor)) {
      return cursor as Album[];
    }

    if (typeof cursor === "object" && cursor !== null && "data" in cursor) {
      cursor = (cursor as { data?: unknown }).data;
      continue;
    }

    break;
  }

  return [];
};

export default function AlbumsScreen() {
  const { userElepad } = useAuth();
  const router = useRouter();
  const groupId = userElepad?.groupId || "";

  const [albumDialogVisible, setAlbumDialogVisible] = useState(false);
  //const [snackbarVisible, setSnackbarVisible] = useState(false);
  //const [snackbarMessage, setSnackbarMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch albums using the custom hook
  const { albumsQuery } = useAlbumCreation();
  const insets = useSafeAreaInsets();

  // Fetch memories for the album creation
  const { data: memoriesResponse } = useGetMemories(
    {
      groupId,
      limit: 100,
    },
    {
      query: {
        enabled: !!groupId,
      },
    },
  );

  const memories = Array.isArray(memoriesResponse?.data)
    ? memoriesResponse.data
    : [];

  // Extract albums from the query
  const albums: Album[] = unwrapAlbums(albumsQuery.data);

  const handleAlbumPress = useCallback(
    (albumId: string) => {
      router.push(`/album-viewer?id=${albumId}`);
    },
    [router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await albumsQuery.refetch();
    setRefreshing(false);
  }, [albumsQuery]);

  return (
    <View
      style={[
        STYLES.safeArea,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 8,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BackButton size={28} onPress={() => router.back()} />
          <Text style={STYLES.superHeading}>Álbumes</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => setAlbumDialogVisible(true)}
          style={{ ...STYLES.miniButton }}
          icon="plus"
        >
          Agregar
        </Button>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {albumsQuery.isLoading && albums.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ ...STYLES.subheading, marginTop: 14 }}>
              Cargando álbumes...
            </Text>
          </View>
        ) : albums.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image source={eleEmpthy} style={styles.emptyImage} />
            <Text style={STYLES.heading}>No hay álbumes aún</Text>
            <Text style={styles.emptyText}>
              Crea álbumes con narrativas generadas por IA a partir de tus
              recuerdos fotográficos.
            </Text>
          </View>
        ) : (
          <FlatList
            data={albums}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            renderItem={({ item, index }) => {
              return (
                <Animated.View
                  entering={ZoomIn.delay(index * 25).springify()}
                  style={styles.columnItem}
                >
                  <AlbumCard
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    coverImageUrl={item.coverImageUrl}
                    pdfUrl={item.urlPdf}
                    createdAt={item.createdAt}
                    totalPages={undefined}
                    onPress={() => handleAlbumPress(item.id)}
                  />
                </Animated.View>
              );
            }}
            ListFooterComponent={
              <View style={{ height: LAYOUT.bottomNavHeight + 80 }} />
            }
          />
        )}
      </View>

      {/* Diálogo para crear álbum con IA */}
      <CreateAlbumDialog
        visible={albumDialogVisible}
        onDismiss={() => setAlbumDialogVisible(false)}
        memories={memories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 180,
    height: 180,
    borderRadius: 18,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  row: {
    justifyContent: "space-between",
  },
  columnItem: {
    width: "48%",
    marginBottom: 16,
  },
});
