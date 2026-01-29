import { useState, useEffect, useRef } from "react";
import { View, Dimensions, Animated, ImageBackground } from "react-native";
import { Image } from "expo-image";
import Reanimated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import {
  Dialog,
  Portal,
  Text,
  IconButton,
  Menu,
  Button,
  TextInput,
} from "react-native-paper";
import { COLORS, STYLES, FONT, SHADOWS } from "@/styles/base";
import { useAudioPlayer } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import Slider from "@react-native-community/slider";
import HighlightedMentionText from "./HighlightedMentionText";
import MentionInput from "./MentionInput";
import StickerReactionPicker from "./StickerReactionPicker";
import fondoRecuerdos from "@/assets/images/fondoRecuerdos.png";

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
}

const screenWidth = Dimensions.get("window").width;

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
}: RecuerdoDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuMounted, setMenuMounted] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [lastReactedStickerUrl, setLastReactedStickerUrl] = useState<
    string | null
  >(null);

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

  // Resetear el player cuando se abre el modal
  useEffect(() => {
    if (visible && shouldUseAudio) {
      console.log("Modal opened, resetting player");
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }

    // Resetear video si existe
    if (visible && shouldUseVideo) {
      try {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [visible, shouldUseAudio, shouldUseVideo, player, videoPlayer]);

  useEffect(() => {
    if (!shouldUseAudio) return;

    // Sincronizar estado con el player
    const checkStatus = () => {
      setIsPlaying(player.playing);
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, [shouldUseAudio, player]);

  // Limpiar el player cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (shouldUseAudio) {
        try {
          console.log("Cleaning up player");
          if (player.playing) {
            player.pause();
          }
          player.seekTo(0);
        } catch {
          console.log("Player already cleaned up");
        }
      }
    };
  }, [shouldUseAudio, player]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

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

  const renderInfoHeader = () => (
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
            color: COLORS.primary,
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

      {menuMounted && recuerdo.autorId === currentUserId && (
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          contentStyle={{
            backgroundColor: COLORS.background,
            borderRadius: 12,
          }}
          anchor={
            <IconButton
              icon="dots-horizontal"
              size={20}
              style={{ margin: 0 }}
              onPress={() => setMenuVisible(true)}
              disabled={isMutating}
            />
          }
        >
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
        </Menu>
      )}
    </View>
  );

  const renderInfoBlock = () => (
    <View style={{ padding: 20, paddingTop: 16 }}>
      {renderInfoHeader()}

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
      {recuerdo.reactions && recuerdo.reactions.length > 0 && (
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
              <Reanimated.View
                entering={ZoomIn.springify()}
                key={reaction.id}
                style={{ position: "relative", marginRight: 4 }}
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
            );
          })}
        </View>
      )}
    </View>
  );

  const playAudio = () => {
    if (!shouldUseAudio) return;

    console.log("Play audio clicked, URL:", recuerdo.contenido);
    console.log("Player state:", player.playing);

    try {
      if (player.playing) {
        console.log("Pausing...");
        player.pause();
      } else {
        console.log("Playing from position:", player.currentTime);
        // Si el audio terminó, volver al inicio
        if (player.currentTime >= player.duration - 0.1) {
          console.log("Audio finished, seeking to start");
          player.seekTo(0);
        }
        player.play();
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  const stopAudio = () => {
    if (!shouldUseAudio) return;

    try {
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  const handleSliderChange = (value: number) => {
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
          <Animated.View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 10,
              width: screenWidth * 0.92,
              elevation: 0,
              shadowColor: "transparent",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
              opacity: fadeAnim,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Contenido principal según el tipo */}
            {recuerdo.tipo === "imagen" && recuerdo.miniatura && (
              <View>
                <View style={{ padding: 14, paddingBottom: 0 }}>
                  <Image
                    source={{ uri: recuerdo.miniatura }}
                    style={{
                      width: "100%",
                      height: screenWidth * 0.84,
                      borderRadius: 0,
                    }}
                    contentFit="cover"
                  />
                </View>

                {/* Información debajo de la imagen */}
                {renderInfoBlock()}
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
                <View
                  style={{
                    backgroundColor: COLORS.backgroundSecondary,
                    paddingTop: 50,
                    paddingBottom: 10,
                    paddingHorizontal: 20,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    minHeight: 220,
                  }}
                >
                  {/* Botón de play/pause centrado */}
                  <View style={{ alignItems: "center", marginBottom: 15 }}>
                    <IconButton
                      icon={isPlaying ? "pause-circle" : "play-circle"}
                      size={70}
                      iconColor={COLORS.primary}
                      onPress={playAudio}
                      style={{ margin: 0 }}
                    />
                  </View>

                  {/* Barra de progreso */}
                  <View style={{ paddingHorizontal: 10 }}>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={duration || 1}
                      value={currentTime}
                      onSlidingComplete={handleSliderChange}
                      minimumTrackTintColor={COLORS.primary}
                      maximumTrackTintColor={COLORS.textSecondary + "40"}
                      thumbTintColor={COLORS.primary}
                    />
                  </View>

                  {/* Tiempos: actual y duración */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 20,
                      marginTop: -10,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        fontFamily: FONT.regular,
                      }}
                    >
                      {formatTime(currentTime)}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        fontFamily: FONT.regular,
                      }}
                    >
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>

                {/* Información debajo del audio */}
                {renderInfoBlock()}
              </View>
            )}
            {/* Visual Feedback for Reaction */}
            {lastReactedStickerUrl && (
              <Reanimated.View
                entering={ZoomIn.springify()}
                exiting={ZoomOut.duration(400)}
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
          </Animated.View>

          {/* Sticker Reaction Picker - Only for elders - Positioned below the dialog */}
          {isElder && onReact && recuerdo && (
            <StickerReactionPicker
              onReact={(stickerId, stickerUrl) => {
                // Show feedback animation
                setLastReactedStickerUrl(stickerUrl);

                // Call the actual reaction handler
                if (onReact) onReact(recuerdo.id, stickerId);

                // Hide feedback after some time
                setTimeout(() => {
                  setLastReactedStickerUrl(null);
                }, 1500);
              }}
              disabled={isMutating}
              onOpenShop={handleDismiss}
            />
          )}
        </Dialog>

        <Dialog
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          style={{
            backgroundColor: COLORS.background,
            width: "92%",
            alignSelf: "center",
            borderRadius: 16,
          }}
        >
          <Dialog.Title
            style={{ ...STYLES.heading, color: COLORS.primary, paddingTop: 8 }}
          >
            Modificar recuerdo
          </Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                backgroundColor: COLORS.backgroundSecondary,
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <TextInput
                label="Título"
                value={editTitle}
                onChangeText={setEditTitle}
                mode="flat"
                style={{ backgroundColor: "transparent" }}
                outlineColor="transparent"
                activeOutlineColor="transparent"
              />
            </View>
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
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 12, paddingRight: 16 }}>
            <Button onPress={() => setEditVisible(false)} disabled={isMutating}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={submitEdit}
              buttonColor={COLORS.primary}
              textColor={COLORS.white}
              loading={isMutating}
              disabled={isMutating}
            >
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{
            backgroundColor: COLORS.background,
            width: "90%",
            alignSelf: "center",
            borderRadius: 16,
          }}
        >
          <Dialog.Title
            style={{ ...STYLES.heading, color: COLORS.primary, paddingTop: 8 }}
          >
            Eliminar recuerdo
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...STYLES.subheading, marginTop: 0 }}>
              ¿Seguro que querés eliminar este recuerdo definitivamente?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 12, paddingRight: 16 }}>
            <Button
              onPress={() => setDeleteConfirmVisible(false)}
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.primary}
              textColor={COLORS.white}
              onPress={confirmDelete}
              loading={isMutating}
              disabled={isMutating}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </>
    </Portal>
  );
}
