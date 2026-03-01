import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Dimensions,
  Animated,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import Reanimated, {
  ZoomIn,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { shareAsync } from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import {
  Dialog,
  Portal,
  Text,
  IconButton,
  Menu
} from "react-native-paper";
import { COLORS, STYLES, FONT, SHADOWS } from "@/styles/base";
import { useAudioPlayer } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import { StyledTextInput } from "../shared";
import SaveButton from "../shared/SaveButton";
import CancelButton from "../shared/CancelButton";
import Slider from "@react-native-community/slider";
import { useGetShopInventory } from "@elepad/api-client";
import HighlightedMentionText from "./HighlightedMentionText";
import MentionInput from "./MentionInput";
import StickerReactionPicker from "./StickerReactionPicker";
import fondoRecuerdos from "@/assets/images/fondoRecuerdos.png";

import cassetteSound from "@/assets/sounds/cassette-play-sound-effect.mp3";

import { Gesture, GestureDetector } from "react-native-gesture-handler";

type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  descripcion?: string;
  autorId?: string;
  autorNombre?: string;
  fecha: Date;
  reactions?: {
    id: string;
    userId: string;
    stickerId: string;
    stickerUrl: string | null;
  }[];
}

interface RecuerdoDetailDialogProps {
  visible: boolean;
  recuerdo: Recuerdo | null;
  onDismiss: () => void;
  onNavigate?: (direction: "next" | "prev") => void;
  onUpdateRecuerdo: (
    id: string,
    patch: { title?: string; caption?: string },
  ) => Promise<void>;
  onDeleteRecuerdo: (id: string) => Promise<void>;
  onReact?: (recuerdoId: string, stickerId: string) => void;
  isMutating?: boolean;
  familyMembers?: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
  currentUserId?: string;
  isElder?: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
  showToast?: (params: { message: string; type: "success" | "error" }) => void;
}

const screenWidth = Dimensions.get("window").width;

const ReactionItem = ({
  reaction,
  member,
  onPress,
}: {
  reaction: {
    id: string;
    userId: string;
    stickerId: string;
    stickerUrl: string | null;
  };
  member: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  onPress: (stickerUrl: string | null) => void;
}) => {
  const handlePress = () => {
    onPress(reaction.stickerUrl);
  };

  return (
    <Pressable onPress={handlePress} style={{ marginRight: 4 }}>
      <Reanimated.View
        entering={ZoomIn.springify()}
        style={{
          position: "relative",
        }}
      >
        {member.avatarUrl ? (
          <Image
            source={{ uri: member.avatarUrl }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: COLORS.white,
            }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: COLORS.white,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 14,
                fontWeight: "bold",
              }}
            >
              {member.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {reaction.stickerUrl && (
          <Image
            source={{ uri: reaction.stickerUrl }}
            style={{
              width: 20,
              height: 20,
              position: "absolute",
              bottom: -4,
              right: -4,
            }}
          />
        )}
      </Reanimated.View>
    </Pressable>
  );
};

export default function RecuerdoDetailDialog({
  visible,
  recuerdo,
  onDismiss,
  onUpdateRecuerdo,
  onDeleteRecuerdo,
  onReact,
  isMutating = false,
  familyMembers = [],
  currentUserId,
  isElder = false,
  onNavigate,
  hasNext = false,
  hasPrev = false,
  showToast,
}: RecuerdoDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);


  const [isPlayingEffect, setIsPlayingEffect] = useState(false);
  const effectPlayer = useAudioPlayer(cassetteSound);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMounted, setMenuMounted] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [lastReactedStickerUrl, setLastReactedStickerUrl] = useState<
    string | null
  >(null);

  // Normalize data helper
  const normalizeData = (
    data: unknown,
  ): (Record<string, unknown> | unknown[]) | undefined => {
    if (!data) return undefined;
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as Record<string, unknown>).data as
        | Record<string, unknown>
        | unknown[];
    }
    return data as Record<string, unknown> | unknown[];
  };

  // Get user's sticker inventory to check if they have any stickers
  const inventoryResponse = useGetShopInventory();
  const inventoryData = normalizeData(inventoryResponse.data);

  // Check if user has at least one sticker
  const hasStickers = Array.isArray(inventoryData)
    ? (inventoryData as Array<{ item?: { type: string }; type?: string }>).some((item) => {
      const itemType = item.item?.type || item.type;
      return itemType === "Sticker" || itemType === "sticker";
    })
    : false;

  // Can react if user is elder OR has at least one sticker
  const canReact = isElder || hasStickers;

  const translateX = useSharedValue(0);
  const swipeDirection = useRef<"next" | "prev" | null>(null);

  const handleNavigation = (dir: "next" | "prev") => {
    if (onNavigate) {
      swipeDirection.current = dir;
      onNavigate(dir);
    }
  };

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-20, 20])
      .onUpdate((e) => {
        let x = e.translationX;
        // Resistance if trying to go beyond bounds
        if ((x < 0 && !hasNext) || (x > 0 && !hasPrev)) {
          x *= 0.2; // Hard resistance
        }
        translateX.value = x;
      })
      .onEnd((e) => {
        if (!onNavigate) {
          translateX.value = withSpring(0);
          return;
        }

        let x = e.translationX;
        // Check effective translation (re-apply resistance logic for consistency check? No, e.translationX is raw)
        // Check intent based on raw gesture
        if (x < -80 && hasNext) {
          // Swipe Left -> Next
          translateX.value = withTiming(-screenWidth, { duration: 200 }, () => {
            runOnJS(handleNavigation)("next");
          });
        } else if (x > 80 && hasPrev) {
          // Swipe Right -> Prev
          translateX.value = withTiming(screenWidth, { duration: 200 }, () => {
            runOnJS(handleNavigation)("prev");
          });
        } else {
          // Bounce back
          translateX.value = withSpring(0);
        }
      });
  }, [onNavigate, hasNext, hasPrev]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Reset animation when recuerdo changes
  useEffect(() => {
    if (swipeDirection.current === "next") {
      translateX.value = screenWidth;
      translateX.value = withSpring(0);
    } else if (swipeDirection.current === "prev") {
      translateX.value = -screenWidth;
      translateX.value = withSpring(0);
    } else {
      translateX.value = 0;
    }
    swipeDirection.current = null;
  }, [recuerdo?.id]);

  // Estado para el flip del cassette
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // Ref para capturar la vista y estado de compartir
  const viewRef = useRef<View>(null);

  // SIEMPRE crear los players (regla de hooks), pero con valores seguros
  const audioUrl =
    recuerdo?.tipo === "audio" && recuerdo.contenido
      ? recuerdo.contenido
      : "https://example.com/dummy.m4a";
  const shouldUseAudio = recuerdo?.tipo === "audio" && recuerdo.contenido;
  const player = useAudioPlayer(audioUrl);

  const videoUrl =
    recuerdo?.tipo === "video" && recuerdo.contenido
      ? recuerdo.contenido
      : "https://example.com/dummy.mp4";
  const shouldUseVideo = recuerdo?.tipo === "video" && recuerdo.contenido;
  const videoPlayer = useVideoPlayer({ uri: videoUrl }, (p) => {
    p.loop = false;
  });

  // Auto-hide reaction feedback
  useEffect(() => {
    if (lastReactedStickerUrl) {
      const timer = setTimeout(() => {
        setLastReactedStickerUrl(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lastReactedStickerUrl]);

  // Resetear el player cuando se abre el modal
  useEffect(() => {
    // Limpiar sticker siempre que cambie la visibilidad (al abrir o cerrar)
    setLastReactedStickerUrl(null);

    if (visible && shouldUseAudio) {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      setIsPlayingEffect(false);
      effectPlayer.seekTo(0);
      effectPlayer.pause();
    }

    if (visible && shouldUseVideo) {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [
    visible,
    shouldUseAudio,
    shouldUseVideo,
    player,
    videoPlayer,
    flipAnimation,
    effectPlayer,
  ]);

  const ignoreEffectCompletion = useRef(false);

  useEffect(() => {
    if (!shouldUseAudio) return;

    // Sincronizar estado con el player
    // Sincronizar estado con el player
    const checkStatus = () => {
      if (isPlayingEffect) {
        if (ignoreEffectCompletion.current) {
          ignoreEffectCompletion.current = false;
          return;
        }

        if (
          effectPlayer.currentTime >= effectPlayer.duration - 0.1 &&
          effectPlayer.duration > 0
        ) {
          setIsPlayingEffect(false);
          effectPlayer.seekTo(0);
          effectPlayer.pause();
          player.play();
        }
      }
      setIsPlaying(player.playing || isPlayingEffect);
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, [shouldUseAudio, player, effectPlayer, isPlayingEffect]);

  // Limpiar el player cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (shouldUseAudio) {
        try {
          if (player.playing) {
            player.pause();
          }
          player.seekTo(0);
          if (effectPlayer.playing) {
            effectPlayer.pause();
          }
        } catch {
          // Player already cleaned up
        }
      }
    };
  }, [shouldUseAudio, player, effectPlayer]);

  if (!recuerdo) return null;

  const closeMenu = () => {
    setMenuVisible(false);
    setMenuMounted(false);
    setTimeout(() => setMenuMounted(true), 50);
  };

  const openEdit = () => {
    closeMenu();
    if (shouldUseAudio) {
      stopAudio();
    }
    if (shouldUseVideo) {
      try {
        videoPlayer.pause();
      } catch {
        // ignore
      }
    }
    setEditTitle(recuerdo.titulo || "");
    setEditDescription(recuerdo.descripcion || "");
    setEditVisible(true);
  };

  const openDeleteConfirm = () => {
    closeMenu();
    if (shouldUseAudio) {
      stopAudio();
    }
    if (shouldUseVideo) {
      try {
        videoPlayer.pause();
      } catch {
        // ignore
      }
    }
    setDeleteConfirmVisible(true);
  };

  const submitEdit = async () => {
    const title = editTitle.trim();
    const caption = editDescription.trim();

    // El padre (recuerdos.tsx) se encargará de extraer los mentions
    await onUpdateRecuerdo(recuerdo.id, {
      title: title || undefined,
      caption: caption || undefined,
    });

    setEditVisible(false);
  };

  const confirmDelete = async () => {
    await onDeleteRecuerdo(recuerdo.id);
    setDeleteConfirmVisible(false);
  };

  const toggleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.timing(flipAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleFrontPlay = () => {
    // Girar al reverso
    if (!isFlipped) {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
    // Reproducir audio
    playAudio();
  };

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const frontAnimatedStyle = {
    opacity: frontOpacity,
  };

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backAnimatedStyle = {
    opacity: backOpacity,
  };

  /*
   * Función para compartir visualmente el recuerdo (Polaroid) o el video
   */
  /*
   * Función para descargar el recuerdo al dispositivo
   */
  const handleDownload = async () => {
    try {
      // Solicitar permisos
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast?.({ message: 'Permiso de almacenamiento denegado', type: 'error' });
        return;
      }

      // Para videos, descargar y guardar en galería
      if (recuerdo.tipo === "video" && recuerdo.contenido) {
        const filename = `video-${recuerdo.id}.mp4`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;

        const downloadResult = await FileSystem.downloadAsync(
          recuerdo.contenido,
          localUri,
        );

        await MediaLibrary.createAssetAsync(downloadResult.uri);
        showToast?.({ message: 'Video guardado en la galería', type: 'success' });
        return;
      }

      // Para audios, descargar y guardar en galería
      if (recuerdo.tipo === "audio" && recuerdo.contenido) {
        const safeTitle = (recuerdo.titulo || `audio-${recuerdo.id}`)
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-_]/g, "")
          .trim()
          .replace(/\s+/g, "_");

        const filename = `${safeTitle || "audio"}.m4a`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;

        const downloadResult = await FileSystem.downloadAsync(
          recuerdo.contenido,
          localUri,
        );

        await MediaLibrary.createAssetAsync(downloadResult.uri);
        showToast?.({ message: 'Audio guardado en la galería', type: 'success' });
        return;
      }

      // Para imágenes, descargar y guardar en galería
      if (recuerdo.tipo === "imagen" && recuerdo.contenido) {
        const filename = `imagen-${recuerdo.id}.jpg`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;

        const downloadResult = await FileSystem.downloadAsync(
          recuerdo.contenido,
          localUri,
        );

        await MediaLibrary.createAssetAsync(downloadResult.uri);
        showToast?.({ message: 'Imagen guardada en la galería', type: 'success' });
        return;
      }

      // Para texto, capturar como imagen y guardar
      if (recuerdo.tipo === "texto") {
        const uri = await captureRef(viewRef, {
          format: "png",
          quality: 1,
        });

        await MediaLibrary.createAssetAsync(uri);
        showToast?.({ message: 'Nota guardada en la galería', type: 'success' });
        return;
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      showToast?.({ message: 'Error al descargar', type: 'error' });
    }
  };

  const handleShare = async () => {
    if (
      recuerdo.tipo !== "imagen" &&
      recuerdo.tipo !== "texto" &&
      recuerdo.tipo !== "video" &&
      recuerdo.tipo !== "audio"
    )
      return;

    try {
      // Para video, descargamos y compartimos el archivo directament (sin marco)
      if (recuerdo.tipo === "video" && recuerdo.contenido) {
        // Generar un nombre de archivo local seguro (evitar query params del URL)
        const filename = `video-${recuerdo.id}.mp4`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;

        // Descargar el video
        const downloadResult = await FileSystem.downloadAsync(
          recuerdo.contenido,
          localUri,
        );

        const uri = downloadResult.uri;

        await shareAsync(uri, {
          mimeType: "video/mp4",
          dialogTitle: recuerdo.titulo || "Compartir video",
          UTI: "public.movie",
        });
        return;
      }

      // Para audio, descargamos y compartimos el archivo directamente
      if (recuerdo.tipo === "audio" && recuerdo.contenido) {
        // Usar el título como nombre de archivo (sanitizado)
        const safeTitle = (recuerdo.titulo || `audio-${recuerdo.id}`)
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-_]/g, "") // Mantener letras (inc. acentos), números, espacios, guiones
          .trim()
          .replace(/\s+/g, "_"); // Reemplazar espacios con guiones bajos

        const filename = `${safeTitle || "audio"}.m4a`;
        const localUri = `${FileSystem.cacheDirectory}${filename}`;

        const downloadResult = await FileSystem.downloadAsync(
          recuerdo.contenido,
          localUri,
        );

        const uri = downloadResult.uri;

        await shareAsync(uri, {
          mimeType: "audio/m4a",
          dialogTitle: recuerdo.titulo || "Compartir audio",
          UTI: "public.audio",
        });
        return;
      }

      // Para imagen, texto y video, usamos view-shot (Polaroid)
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });

      const message = `${recuerdo.titulo || "Recuerdo"}. ${recuerdo.autorNombre || "Alguien"
        } te invita a usar Elepad.`;

      await shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: message,
        UTI: "public.png",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const renderInfoHeader = (showActions = true) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      {recuerdo.titulo ? (
        <Text
          style={{
            ...STYLES.heading,
            color: "#000000",
            textAlign: "left",
            flex: 1,
            paddingRight: 8,
          }}
        >
          {recuerdo.titulo}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {showActions && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {(recuerdo.tipo === "imagen" ||
            recuerdo.tipo === "texto" ||
            recuerdo.tipo === "video" ||
            recuerdo.tipo === "audio") && (
              <TouchableOpacity
                onPress={handleShare}
                disabled={isMutating}
                activeOpacity={0.6}
                style={{ padding: 8 }}
              >
                <MaterialCommunityIcons
                  name="share-variant"
                  size={22}
                  color={COLORS.textSecondary || "#757575"}
                />
              </TouchableOpacity>
            )}

          {menuMounted && (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              contentStyle={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
              }}
              anchor={
                <IconButton
                  icon="dots-horizontal"
                  size={20}
                  iconColor={COLORS.textSecondary}
                  style={{ margin: 0 }}
                  onPress={() => setMenuVisible(true)}
                  disabled={isMutating}
                />
              }
            >
              <Menu.Item
                leadingIcon="download"
                title="Descargar"
                onPress={() => {
                  closeMenu();
                  handleDownload();
                }}
                disabled={isMutating}
              />
              {recuerdo.autorId === currentUserId && (
                <>
                  <Menu.Item
                    leadingIcon="pencil"
                    title="Modificar"
                    onPress={openEdit}
                    disabled={isMutating}
                  />
                  <Menu.Item
                    leadingIcon="trash-can"
                    title="Eliminar"
                    onPress={openDeleteConfirm}
                    disabled={isMutating}
                  />
                </>
              )}
            </Menu>
          )}
        </View>
      )}
    </View>
  );

  const renderInfoBlock = (showActions = true) => (
    <View style={{ padding: 20, paddingTop: 16 }}>
      {renderInfoHeader(showActions)}

      {!!recuerdo.descripcion && (
        <HighlightedMentionText
          text={recuerdo.descripcion}
          familyMembers={familyMembers}
          style={{
            ...STYLES.subheading,
            marginTop: 8,
            textAlign: "left",
          }}
        />
      )}

      <Text
        style={{
          fontSize: 13,
          color: COLORS.textSecondary,
          marginTop: 8,
          fontFamily: FONT.regular,
        }}
      >
        Subido por: {recuerdo.autorNombre || "Desconocido"}
      </Text>

      <Text
        style={{
          fontSize: 13,
          color: COLORS.textSecondary,
          marginTop: 8,
          fontFamily: FONT.regular,
        }}
      >
        {recuerdo.fecha.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {" · "}
        {recuerdo.fecha.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>

      {/* Reacciones */}
      {showActions && recuerdo.reactions && recuerdo.reactions.length > 0 && (
        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {recuerdo.reactions.map((reaction) => {
            const member = familyMembers.find((m) => m.id === reaction.userId);
            if (!member) return null;
            return (
              <ReactionItem
                key={reaction.id}
                reaction={reaction}
                member={member}
                onPress={(stickerUrl) => {
                  if (stickerUrl) {
                    setLastReactedStickerUrl(stickerUrl);
                  }
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );

  function playAudio() {
    if (!shouldUseAudio) return;

    try {
      if (isPlayingEffect) {
        setIsPlayingEffect(false);
        effectPlayer.pause();
        effectPlayer.seekTo(0);
        return;
      }

      if (player.playing) {
        player.pause();
      } else {
        // Si el audio terminó, volver al inicio
        if (
          player.currentTime >= player.duration - 0.1 &&
          player.duration > 0
        ) {
          player.pause();
          player.seekTo(0);
          // Play effect first
          setIsPlayingEffect(true);
          ignoreEffectCompletion.current = true;
          effectPlayer.seekTo(0);
          effectPlayer.play();
        } else if (player.currentTime === 0) {
          // Play effect first if starting from 0
          player.pause();
          setIsPlayingEffect(true);
          ignoreEffectCompletion.current = true;
          effectPlayer.seekTo(0);
          effectPlayer.play();
        } else {
          // Resume
          player.play();
        }
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  function stopAudio() {
    if (!shouldUseAudio) return;

    try {
      player.pause();
      player.seekTo(0);
      if (effectPlayer.playing) {
        effectPlayer.pause();
        effectPlayer.seekTo(0);
      }
      setIsPlayingEffect(false);
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  function handleSliderChange(value: number) {
    if (!shouldUseAudio) return;

    try {
      player.seekTo(value);
      setCurrentTime(value);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDismiss = () => {
    setLastReactedStickerUrl(null);
    if (shouldUseAudio) {
      stopAudio();
    }
    if (shouldUseVideo) {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      } catch {
        // ignore
      }
    }
    onDismiss();
  };

  return (
    <Portal>
      <>
        {/* SHADOW VIEW FOR CAPTURE - Off-screen rendering of the clean card */}
        {(recuerdo.tipo === "imagen" ||
          recuerdo.tipo === "texto" ||
          recuerdo.tipo === "video") && (
            <View
              style={{
                position: "absolute",
                top: screenWidth * 3, // Way off screen
                left: 0,
                zIndex: -100,
              }}
            >
              <View
                ref={viewRef}
                collapsable={false}
                style={{
                  backgroundColor:
                    recuerdo.tipo === "texto" ? "transparent" : COLORS.white,
                  borderRadius: 0,
                  width: screenWidth * 0.92,
                  overflow: "hidden",
                  opacity: 1,
                }}
              >
                {recuerdo.tipo === "texto" ? (
                  <ImageBackground
                    source={fondoRecuerdos}
                    resizeMode="cover"
                    style={{
                      padding: 10,
                      justifyContent: "center",
                      minHeight: 200,
                      width: screenWidth * 0.92,
                    }}
                  >
                    {renderInfoBlock(false)}
                  </ImageBackground>
                ) : (
                  <View>
                    <View style={{ padding: 14, paddingBottom: 0 }}>
                      {recuerdo.tipo === "imagen" && recuerdo.miniatura && (
                        <Image
                          source={{ uri: recuerdo.miniatura }}
                          style={{
                            width: "100%",
                            height: screenWidth * 0.84,
                            borderRadius: 0,
                          }}
                          contentFit="cover"
                        />
                      )}
                      {recuerdo.tipo === "video" && (
                        <View
                          style={{
                            width: "100%",
                            height: screenWidth * 0.84,
                            borderRadius: 0,
                            backgroundColor: "#000",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                          }}
                        >
                          {recuerdo.miniatura ? (
                            <Image
                              source={{ uri: recuerdo.miniatura }}
                              style={{
                                width: "100%",
                                height: "100%",
                                position: "absolute",
                              }}
                              contentFit="cover"
                            />
                          ) : null}
                          <MaterialCommunityIcons
                            name="play-circle-outline"
                            size={64}
                            color="rgba(255,255,255,0.8)"
                            style={{ zIndex: 10 }}
                          />
                        </View>
                      )}
                    </View>
                    {/* Render info WITHOUT actions for the screenshot */}
                    {renderInfoBlock(false)}
                  </View>
                )}
              </View>
            </View>
          )}

        <Dialog
          visible={visible}
          onDismiss={handleDismiss}
          style={{
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
            elevation: 0,
            shadowColor: "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
          }}
        >
          <GestureDetector gesture={panGesture}>
            <Reanimated.View
              entering={ZoomIn}
              style={[
                {
                  backgroundColor:
                    recuerdo.tipo === "audio" || recuerdo.tipo === "texto"
                      ? "transparent"
                      : COLORS.white,
                  borderRadius: 10,
                  width: screenWidth * 0.92,
                  elevation: 0,
                  shadowColor: "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  position: "relative",
                  overflow: "hidden",
                },
                animatedStyle,
              ]}
            >
              {/* Contenido principal según el tipo */}
              {recuerdo.tipo === "imagen" && recuerdo.miniatura && (
                <View>
                  <View style={{ padding: 14, paddingBottom: 0 }}>
                    <Pressable
                      onPress={handleShare}
                      style={{ opacity: 1 }}
                      android_ripple={null}
                    >
                      <Image
                        source={{ uri: recuerdo.miniatura }}
                        style={{
                          width: "100%",
                          height: screenWidth * 0.84,
                          borderRadius: 0,
                        }}
                        contentFit="cover"
                      />
                    </Pressable>
                  </View>

                  {/* Información debajo de la imagen */}
                  {renderInfoBlock(true)}
                </View>
              )}

              {recuerdo.tipo === "video" && recuerdo.contenido && (
                <View>
                  <View style={{ padding: 14, paddingBottom: 0 }}>
                    <VideoView
                      player={videoPlayer}
                      style={{
                        width: "100%",
                        height: screenWidth * 0.84,
                        borderRadius: 0,
                      }}
                      nativeControls
                      contentFit="contain"
                    />
                  </View>

                  {/* Información debajo del video */}
                  {renderInfoBlock()}
                </View>
              )}

              {recuerdo.tipo === "texto" && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 0,
                  }}
                >
                  <ImageBackground
                    source={fondoRecuerdos}
                    style={{
                      borderRadius: 10,
                      padding: 10,
                      justifyContent: "center",
                      ...SHADOWS.card,
                      borderColor: "#f1f1f1", // Softer beige border
                      minHeight: 200,
                      width: screenWidth * 0.92,
                    }}
                  >
                    {/* Información de la nota */}
                    {renderInfoBlock()}
                  </ImageBackground>
                </View>
              )}

              {recuerdo.tipo === "audio" && (
                <View>
                  {/* Contenedor de controles frontales: girar + play */}
                  <View
                    style={{
                      alignItems: "center",
                      paddingTop: 12,
                      paddingBottom: 8,
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    <TouchableOpacity
                      onPress={toggleFlip}
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        icon="swap-horizontal"
                        size={28}
                        iconColor="#ffffff"
                        style={{ margin: 0 }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleFrontPlay}
                      activeOpacity={0.7}
                      style={{
                        marginLeft: 12,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        icon="play"
                        size={20}
                        iconColor="#ffffff"
                        style={{ margin: 0 }}
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      minHeight: 245,
                      backgroundColor: "#1a1a1a",
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {/* Frente del cassette */}
                    <Animated.View
                      pointerEvents={isFlipped ? "none" : "auto"}
                      style={[
                        {
                          position: "absolute",
                          width: "100%",
                          top: 0,
                          left: 0,
                        },
                        frontAnimatedStyle,
                      ]}
                    >
                      <View
                        style={{
                          backgroundColor: "#1a1a1a",
                          paddingTop: 16,
                          paddingBottom: 16,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          minHeight: 245,
                          borderWidth: 3,
                          borderColor: "#1a1a1a",
                          ...SHADOWS.medium,
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Etiqueta superior estilo cassette con título */}
                        <View
                          style={{
                            backgroundColor: "#e8e8e8",
                            padding: 8,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: "#c0c0c0",
                            justifyContent: "center",
                            minHeight: 48,
                          }}
                        >
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 14,
                              color: "#1a1a1a",
                              textAlign: "center",
                              fontFamily: "Montserrat",
                              fontWeight: "600",
                              width: "100%",
                            }}
                          >
                            {recuerdo.titulo || "Nota de voz"}
                          </Text>
                        </View>

                        {/* Menú debajo de la etiqueta - posición absoluta */}
                        <View
                          style={{
                            position: "absolute",
                            top: 68,
                            right: 16,
                            zIndex: 100,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <IconButton
                            icon="share-variant"
                            size={22}
                            iconColor="#e8e8e8"
                            style={{ margin: 0 }}
                            onPress={handleShare}
                            disabled={isMutating}
                          />
                          {menuMounted ? (
                            <Menu
                              visible={menuVisible}
                              onDismiss={closeMenu}
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                borderRadius: 12,
                              }}
                              anchor={
                                <IconButton
                                  icon="dots-horizontal"
                                  size={22}
                                  iconColor="#e8e8e8"
                                  style={{ margin: 0 }}
                                  onPress={() => setMenuVisible(true)}
                                  disabled={isMutating}
                                />
                              }
                            >
                              <Menu.Item
                                leadingIcon="download"
                                title="Descargar"
                                onPress={() => {
                                  closeMenu();
                                  handleDownload();
                                }}
                                disabled={isMutating}
                              />
                              {recuerdo.autorId === currentUserId && (
                                <>
                                  <Menu.Item
                                    leadingIcon="pencil"
                                    title="Modificar"
                                    onPress={openEdit}
                                    disabled={isMutating}
                                  />
                                  <Menu.Item
                                    leadingIcon="trash-can"
                                    title="Eliminar"
                                    onPress={openDeleteConfirm}
                                    disabled={isMutating}
                                  />
                                </>
                              )}
                            </Menu>
                          ) : (
                            <IconButton
                              icon="dots-horizontal"
                              size={22}
                              iconColor="#e8e8e8"
                              style={{ margin: 0 }}
                              onPress={() => setMenuVisible(true)}
                              disabled={isMutating}
                            />
                          )}
                        </View>


                        {/* Diseño del cassette - réplica exacta de la miniatura */}
                        <TouchableOpacity
                          onPress={handleFrontPlay}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 12,
                          }}
                        >
                          <View
                            style={{
                              width: "85%",
                              height: 80,
                              backgroundColor: "#2a2a2a",
                              borderRadius: 40,
                              borderWidth: 3,
                              borderColor: "#4a4a4a",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingHorizontal: 8,
                            }}
                          >
                            <View
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                borderWidth: 4,
                                borderColor: "#4a4a4a",
                                backgroundColor: "#1a1a1a",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: "#d0d0d0",
                                }}
                              />
                            </View>
                            {/* Ventana central del cassette */}
                            <View
                              style={{
                                width: 100,
                                height: 40,
                                backgroundColor: "#1a1a1a",
                                borderRadius: 4,
                                borderWidth: 2,
                                borderColor: "#4a4a4a",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: "80%",
                                  height: 4,
                                  backgroundColor: COLORS.primary,
                                }}
                              />
                            </View>
                            <View
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                borderWidth: 4,
                                borderColor: "#4a4a4a",
                                backgroundColor: "#1a1a1a",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: "#d0d0d0",
                                }}
                              />
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>

                    {/* Reverso del cassette */}
                    <Animated.View
                      pointerEvents={isFlipped ? "auto" : "none"}
                      style={[
                        {
                          position: "absolute",
                          width: "100%",
                          top: 0,
                          left: 0,
                        },
                        backAnimatedStyle,
                      ]}
                    >
                      <View
                        style={{
                          backgroundColor: "#1a1a1a",
                          paddingTop: 16,
                          paddingBottom: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          minHeight: 215,
                          borderWidth: 3,
                          borderColor: "#1a1a1a",
                          ...SHADOWS.medium,
                        }}
                      >
                        {/* Display LCD con tiempos y botón de play */}
                        <View
                          style={{
                            backgroundColor: "#3d3d3d",
                            padding: 6,
                            borderRadius: 6,
                            marginBottom: 16,
                            borderWidth: 2,
                            borderColor: "#2a2a2a",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: COLORS.primary,
                                fontSize: 16,
                                fontFamily: "monospace",
                                fontWeight: "bold",
                              }}
                            >
                              {formatTime(currentTime)}
                            </Text>

                            {/* Botón de play en el medio */}
                            <TouchableOpacity
                              onPress={playAudio}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: COLORS.primary,
                                justifyContent: "center",
                                alignItems: "center",
                                ...SHADOWS.medium,
                              }}
                            >
                              <IconButton
                                icon={isPlaying ? "pause" : "play"}
                                size={24}
                                iconColor="#1a1a1a"
                                style={{ margin: 0 }}
                              />
                            </TouchableOpacity>

                            <Text
                              style={{
                                color: COLORS.primary,
                                fontSize: 16,
                                fontFamily: "monospace",
                                fontWeight: "bold",
                              }}
                            >
                              {formatTime(duration)}
                            </Text>
                          </View>

                          {/* Barra de progreso dentro del LCD */}
                          <View style={{ paddingHorizontal: 4 }}>
                            <Slider
                              style={{ width: "100%", height: 15 }}
                              minimumValue={0}
                              maximumValue={duration || 1}
                              value={currentTime}
                              onSlidingComplete={handleSliderChange}
                              minimumTrackTintColor={COLORS.primary}
                              maximumTrackTintColor="#2a2a2a"
                              thumbTintColor="#e0e0e0"
                            />
                          </View>
                        </View>

                        {/* Información */}
                        <View
                          style={{
                            backgroundColor: "#2a2a2a",
                            padding: 10,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "#3a3a3a",
                          }}
                        >
                          {/* Descripción si existe */}
                          {recuerdo.descripcion && (
                            <View style={{ marginBottom: 10 }}>
                              <HighlightedMentionText
                                text={recuerdo.descripcion}
                                familyMembers={familyMembers}
                                style={{
                                  fontSize: 12,
                                  color: "#d0d0d0",
                                  fontFamily: FONT.regular,
                                  lineHeight: 16,
                                }}
                              />
                            </View>
                          )}

                          {/* Autor y fecha */}
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingTop: recuerdo.descripcion ? 10 : 0,
                              borderTopWidth: recuerdo.descripcion ? 1 : 0,
                              borderTopColor: "#3a3a3a",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#999",
                                fontFamily: FONT.regular,
                              }}
                            >
                              {recuerdo.autorNombre || "Desconocido"}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#999",
                                fontFamily: FONT.regular,
                              }}
                            >
                              {new Date(recuerdo.fecha).toLocaleDateString()}
                            </Text>
                          </View>

                          {/* Reacciones si existen */}
                          {recuerdo.reactions &&
                            recuerdo.reactions.length > 0 && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: 8,
                                  paddingTop: 10,
                                }}
                              >
                                {recuerdo.reactions.map((reaction, idx) => {
                                  const member = familyMembers.find(
                                    (m) => m.id === reaction.userId,
                                  );
                                  return (
                                    <Reanimated.View
                                      key={`${reaction.userId}-${idx}`}
                                      entering={ZoomIn.delay(idx * 50)}
                                      style={{
                                        position: "relative",
                                        width: 28,
                                        height: 28,
                                      }}
                                    >
                                      {member?.avatarUrl ? (
                                        <Image
                                          source={{ uri: member.avatarUrl }}
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            borderWidth: 2,
                                            borderColor: COLORS.primary,
                                          }}
                                        />
                                      ) : (
                                        <View
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: COLORS.primary,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderWidth: 2,
                                            borderColor: "#d85a2a",
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "#1a1a1a",
                                              fontSize: 11,
                                              fontWeight: "bold",
                                            }}
                                          >
                                            {member?.displayName
                                              ?.charAt(0)
                                              .toUpperCase()}
                                          </Text>
                                        </View>
                                      )}
                                      {reaction.stickerUrl && (
                                        <Image
                                          source={{ uri: reaction.stickerUrl }}
                                          style={{
                                            width: 14,
                                            height: 14,
                                            position: "absolute",
                                            bottom: -3,
                                            right: -3,
                                          }}
                                        />
                                      )}
                                    </Reanimated.View>
                                  );
                                })}
                              </View>
                            )}
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                </View>
              )}
              {/* Visual Feedback for Reaction */}
              {lastReactedStickerUrl && (
                <Reanimated.View
                  entering={ZoomIn.springify()}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: "30%",
                    alignSelf: "center",
                    zIndex: 2000,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    borderRadius: 50,
                    padding: 20,
                    ...SHADOWS.medium,
                  }}
                >
                  <Image
                    source={{ uri: lastReactedStickerUrl }}
                    style={{ width: 100, height: 100 }}
                    contentFit="contain"
                  />
                </Reanimated.View>
              )}
            </Reanimated.View>
          </GestureDetector>

          {/* Sticker Reaction Picker - Show if user can react (elder or has stickers) - Positioned below the dialog */}
          {canReact && onReact && recuerdo && (
            <StickerReactionPicker
              onReact={(stickerId, stickerUrl) => {
                // Show feedback animation
                setLastReactedStickerUrl(stickerUrl);

                // Call the actual reaction handler
                if (onReact) onReact(recuerdo.id, stickerId);
              }}
              disabled={isMutating}
              onOpenShop={handleDismiss}
            />
          )}
        </Dialog>

        {/* Modal de edición */}
        <Modal
          visible={editVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setEditVisible(false)}
        >
          <View style={modalStyles.container}>
            <TouchableOpacity
              style={modalStyles.backdrop}
              activeOpacity={1}
              onPress={() => setEditVisible(false)}
            />
            <KeyboardAvoidingView
              behavior="padding"
              style={modalStyles.content}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <Text style={modalStyles.title}>
                Modificar recuerdo
              </Text>
              <View style={{ marginTop: 16, marginBottom: 24 }}>
                <StyledTextInput
                  label="Título"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  marginBottom={16}
                />
                <View
                  style={{
                    backgroundColor: COLORS.backgroundSecondary,
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  <MentionInput
                    label="Descripción"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    mode="flat"
                    inputStyle={{ backgroundColor: "transparent" }}
                    outlineColor="transparent"
                    activeOutlineColor="transparent"
                    multiline
                    numberOfLines={3}
                    familyMembers={familyMembers}
                    currentUserId={currentUserId}
                  />
                </View>
              </View>
              <View style={modalStyles.actions}>
                <View style={{ width: 120 }}>
                  <CancelButton
                    onPress={() => setEditVisible(false)}
                    disabled={isMutating}
                  />
                </View>
                <View style={{ width: 120 }}>
                  <SaveButton
                    onPress={submitEdit}
                    loading={isMutating}
                    disabled={isMutating}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Modal de confirmación de eliminación */}
        <Modal
          visible={deleteConfirmVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setDeleteConfirmVisible(false)}
        >
          <View style={modalStyles.container}>
            <TouchableOpacity
              style={modalStyles.backdrop}
              activeOpacity={1}
              onPress={() => setDeleteConfirmVisible(false)}
            />
            <View style={modalStyles.dialogContent}>
              <Text style={[STYLES.heading, { fontSize: 18, marginBottom: 16 }]}>
                Eliminar recuerdo
              </Text>
              <Text style={{ ...STYLES.subheading, marginTop: 0 }}>
                ¿Seguro que querés eliminar este recuerdo definitivamente?
              </Text>
              <View style={modalStyles.actions}>
                <View style={{ width: 120 }}>
                  <CancelButton
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={isMutating}
                  />
                </View>
                <View style={{ width: 120 }}>
                  <SaveButton
                    text="Eliminar"
                    onPress={confirmDelete}
                    loading={isMutating}
                    disabled={isMutating}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </>
    </Portal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: COLORS.background,
    width: "92%",
    borderRadius: 16,
    padding: 24,
    paddingTop: 20,
    maxWidth: 500,
  },
  dialogContent: {
    backgroundColor: COLORS.background,
    width: "90%",
    borderRadius: 16,
    padding: 24,
    paddingTop: 20,
    maxWidth: 500,
  },
  title: {
    ...STYLES.heading,
    fontSize: 20,
    marginBottom: 0,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingBottom: 20
  },
});
