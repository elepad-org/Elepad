import { useState, useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { ActivityIndicator, IconButton, Text } from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/styles/base";
import * as ScreenOrientation from "expo-screen-orientation";
import PagerView, {
  PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { useGetAlbumId, AlbumWithPages } from "@elepad/api-client";
import AlbumPageView from "@/components/shared/AlbumPageView";

export default function AlbumViewerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const albumId = params.id as string;
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch album with pages
  const { data: albumResponse, isLoading, error } = useGetAlbumId(
    albumId,
    {
      query: {
        enabled: !!albumId,
      },
    }
  );

  // Extract album data
  const album: AlbumWithPages | null = (() => {
    if (!albumResponse) return null;
    
    // Handle wrapped response
    if ('data' in albumResponse) {
      return (albumResponse).data as AlbumWithPages;
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
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (err) {
      console.error("Error restoring orientation:", err);
    }
    router.back();
  }, [router]);

  const handlePageChange = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      setCurrentPage(event.nativeEvent.position);
    },
    []
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando álbum...</Text>
      </View>
    );
  }

  if (error || !album) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={styles.errorText}>
          Error al cargar el álbum
        </Text>
        <IconButton
          icon="close"
          size={32}
          iconColor={COLORS.white}
          onPress={handleClose}
          style={styles.closeButton}
        />
      </View>
    );
  }

  if (pages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={styles.emptyText}>
          Este álbum aún no tiene páginas
        </Text>
        <IconButton
          icon="close"
          size={32}
          iconColor={COLORS.white}
          onPress={handleClose}
          style={styles.closeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      {/* Close Button */}
      <IconButton
        icon="close"
        size={28}
        iconColor={COLORS.white}
        onPress={handleClose}
        style={styles.closeButton}
      />

      {/* Album Title Overlay */}
      <View style={styles.titleOverlay}>
        <Text style={styles.titleText} numberOfLines={1}>
          {album.title}
        </Text>
      </View>

      {/* Page Navigation Arrows */}
      {currentPage > 0 && (
        <IconButton
          icon="chevron-left"
          size={36}
          iconColor={COLORS.white}
          onPress={() => pagerRef.current?.setPage(currentPage - 1)}
          style={styles.navButtonLeft}
        />
      )}

      {currentPage < pages.length - 1 && (
        <IconButton
          icon="chevron-right"
          size={36}
          iconColor={COLORS.white}
          onPress={() => pagerRef.current?.setPage(currentPage + 1)}
          style={styles.navButtonRight}
        />
      )}

      {/* Pager View */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {pages.map((page, index) => (
          <View key={page.id} style={styles.page}>
            <AlbumPageView
              page={page}
              pageNumber={index + 1}
              totalPages={pages.length}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3",
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
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  titleOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 80,
    zIndex: 99,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.white,
  },
  navButtonLeft: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -24,
    zIndex: 98,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  navButtonRight: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -24,
    zIndex: 98,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
