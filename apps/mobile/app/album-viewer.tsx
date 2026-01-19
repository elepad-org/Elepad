import { useState, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, StatusBar, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, IconButton, Text } from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/styles/base";
import * as ScreenOrientation from "expo-screen-orientation";
import Pager, {
  type PagerOnPageSelectedEvent,
  type PagerRef,
} from "@/components/shared/Pager";
import { useGetAlbumId, AlbumWithPages } from "@elepad/api-client";
import AlbumPageView from "@/components/shared/AlbumPageView";
import fondoRecuerdos from "@/assets/images/fondoRecuerdos.png";

export default function AlbumViewerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const albumId = params.id as string;
  const pagerRef = useRef<PagerRef>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const insets = useSafeAreaInsets();

  // Fetch album with pages
  const {
    data: albumResponse,
    isLoading,
    error,
  } = useGetAlbumId(albumId, {
    query: {
      enabled: !!albumId,
    },
  });

  // Extract album data
  const album: AlbumWithPages | null = (() => {
    if (!albumResponse) return null;

    // Handle wrapped response
    if ("data" in albumResponse) {
      return albumResponse.data as AlbumWithPages;
    }

    return albumResponse as AlbumWithPages;
  })();

  const pages = album?.pages || [];

  // Lock orientation to landscape on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (err) {
        console.error("Error locking orientation:", err);
      }
    };

    lockOrientation();

    // Cleanup: unlock orientation when unmounting
    return () => {
      ScreenOrientation.unlockAsync().catch((err: Error) => {
        console.error("Error unlocking orientation:", err);
      });
    };
  }, []);

  const handleClose = useCallback(async () => {
    // Unlock orientation before navigating back
    try {
      await ScreenOrientation.unlockAsync();
    } catch (err) {
      // Ignore orientation errors - some devices/simulators don't support all orientations
      console.log("Could not unlock orientation:", err);
    }
    router.back();
  }, [router]);

  const handlePageChange = useCallback(
    (event: PagerOnPageSelectedEvent) => {
      setCurrentPage(event.nativeEvent.position);
    },
    []
  );

  if (isLoading) {
    return (
      <ImageBackground
        source={fondoRecuerdos}
        style={styles.loadingContainer}
        resizeMode="cover"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando álbum...</Text>
      </ImageBackground>
    );
  }

  if (error || !album) {
    return (
      <ImageBackground
        source={fondoRecuerdos}
        style={styles.errorContainer}
        resizeMode="cover"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={styles.errorText}>Error al cargar el álbum</Text>
        <IconButton
          icon="close"
          size={32}
          iconColor={COLORS.white}
          onPress={handleClose}
          style={styles.closeButton}
        />
      </ImageBackground>
    );
  }

  if (pages.length === 0) {
    return (
      <ImageBackground
        source={fondoRecuerdos}
        style={styles.emptyContainer}
        resizeMode="cover"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={styles.emptyText}>Este álbum aún no tiene páginas</Text>
        <IconButton
          icon="close"
          size={32}
          iconColor={COLORS.white}
          onPress={handleClose}
          style={styles.closeButton}
        />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={fondoRecuerdos}
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      {/* Pager View - Debe ir primero para que los botones estén encima */}
      <Pager
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {pages.map((page, index) => (
          <View key={page.id} style={styles.page} collapsable={false}>
            <AlbumPageView
              page={page}
              pageNumber={index + 1}
              totalPages={pages.length}
            />
          </View>
        ))}
      </Pager>

      {/* Close Button - Renderizado después para estar encima */}
      <IconButton
        icon="close"
        size={32}
        iconColor={COLORS.white}
        onPress={handleClose}
        style={[
          styles.closeButton,
          {
            top: Math.max(insets.top, 12),
            right: Math.max(insets.right, 12),
          },
        ]}
      />

      {/* Album Title Overlay */}
      {/* <View
        style={[
          styles.titleOverlay,
          {
            top: Math.max(insets.top, 12),
            left: Math.max(insets.left, 12),
          },
        ]}
      >
        <Text style={styles.titleText} numberOfLines={1}>
          {album.title}
        </Text>
      </View> */}

      {/* Page Navigation Arrows */}
      {currentPage > 0 && (
        <IconButton
          icon="chevron-left"
          size={40}
          iconColor={COLORS.white}
          onPress={() => pagerRef.current?.setPage(currentPage - 1)}
          style={[styles.navButtonLeft, { left: Math.max(insets.left, 4) }]}
        />
      )}

      {currentPage < pages.length - 1 && (
        <IconButton
          icon="chevron-right"
          size={40}
          iconColor={COLORS.white}
          onPress={() => pagerRef.current?.setPage(currentPage + 1)}
          style={[styles.navButtonRight, { right: Math.max(insets.right, 4) }]}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3",
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3",
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  titleOverlay: {
    position: "absolute",
    zIndex: 999,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "35%",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  navButtonLeft: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    zIndex: 998,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  navButtonRight: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    zIndex: 998,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
