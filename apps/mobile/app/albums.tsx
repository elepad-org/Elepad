import { useState, useCallback } from "react";
import {
  StatusBar,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  IconButton,
  //Snackbar,
  FAB,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { useGetMemories, Album } from "@elepad/api-client";
import CreateAlbumDialog from "@/components/Recuerdos/CreateAlbumDialog";
import AlbumCard from "@/components/shared/AlbumCard";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import eleEmpthy from "@/assets/images/ele-idea.jpeg";
import { Image } from "react-native";

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
    }
  );

  const memories = Array.isArray(memoriesResponse?.data)
    ? memoriesResponse.data
    : [];

  // Extract albums from the query
  const albums: Album[] = unwrapAlbums(albumsQuery.data);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAlbumPress = useCallback(
    (albumId: string) => {
      router.push(`/album-viewer?id=${albumId}`);
    },
    [router]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await albumsQuery.refetch();
    setRefreshing(false);
  }, [albumsQuery]);

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            style={{ margin: 0 }}
            onPress={handleBack}
          />
          <Text style={styles.headerTitle}>Álbumes</Text>
          <View style={{ width: 40 }} />
        </View>
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            renderItem={({ item }) => {
              return (
                <AlbumCard
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  coverImageUrl={null}
                  createdAt={item.createdAt}
                  totalPages={undefined}
                  onPress={() => handleAlbumPress(item.id)}
                />
              );
            }}
            ListFooterComponent={
              <View style={{ height: LAYOUT.bottomNavHeight + 80 }} />
            }
          />
        )}
      </View>

      {/* FAB for creating new album */}
      {albums.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setAlbumDialogVisible(true)}
          color={COLORS.white}
        />
      )}

      {/* Diálogo para crear álbum con IA */}
      <CreateAlbumDialog
        visible={albumDialogVisible}
        onDismiss={() => setAlbumDialogVisible(false)}
        memories={memories}
      />

      {/* Snackbar para mostrar mensajes */}
      {/* <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2200}
        style={{
          backgroundColor: COLORS.success,
          borderRadius: 16,
          marginBottom: 10,
          marginHorizontal: 20,
        }}
      >
        {snackbarMessage}
      </Snackbar> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
    paddingTop: 16,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: LAYOUT.bottomNavHeight + 16,
    backgroundColor: COLORS.primary,
  },
});
