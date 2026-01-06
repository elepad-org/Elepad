import { useState, useEffect } from "react";
import { View, Image, Dimensions } from "react-native";
import {
  Dialog,
  Portal,
  Text,
  IconButton,
  Menu,
  Button,
  TextInput,
} from "react-native-paper";
import { COLORS, STYLES, FONT } from "@/styles/base";
import { useAudioPlayer } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import Slider from "@react-native-community/slider";
import HighlightedMentionText from "./HighlightedMentionText";
import MentionInput from "./MentionInput";

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
}

interface RecuerdoDetailDialogProps {
  visible: boolean;
  recuerdo: Recuerdo | null;
  onDismiss: () => void;
  onUpdateRecuerdo: (
    id: string,
    patch: { title?: string; caption?: string }
  ) => Promise<void>;
  onDeleteRecuerdo: (id: string) => Promise<void>;
  isMutating?: boolean;
  familyMembers?: Array<{ id: string; displayName: string; avatarUrl?: string | null }>;
  currentUserId?: string;
}

const screenWidth = Dimensions.get("window").width;

export default function RecuerdoDetailDialog({
  visible,
  recuerdo,
  onDismiss,
  onUpdateRecuerdo,
  onDeleteRecuerdo,
  isMutating = false,
  familyMembers = [],
  currentUserId,
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

  const InfoHeader = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          ...STYLES.heading,
          textAlign: "left",
          flex: 1,
          paddingRight: 8,
        }}
      >
        {recuerdo.titulo || "Sin título"}
      </Text>

      {menuMounted && (
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

  const InfoBlock = () => (
    <View style={{ padding: 20, paddingTop: 16 }}>
      <InfoHeader />

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
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 10,
              overflow: "hidden",
              width: screenWidth * 0.92,
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
                    resizeMode="cover"
                  />
                </View>

                {/* Información debajo de la imagen */}
                <InfoBlock />
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
                <InfoBlock />
              </View>
            )}

            {recuerdo.tipo === "texto" && (
              <View>
                {/* Información de la nota */}
                <View style={{ paddingTop: 4 }}>
                  <InfoBlock />
                </View>
              </View>
            )}

            {recuerdo.tipo === "audio" && (
              <View>
                <View
                  style={{
                    backgroundColor: COLORS.accent,
                    paddingTop: 50,
                    paddingBottom: 10,
                    paddingHorizontal: 20,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
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
                <InfoBlock />
              </View>
            )}
          </View>
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
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
            Modificar recuerdo
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Título"
              value={editTitle}
              onChangeText={setEditTitle}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              style={{ marginBottom: 12 }}
            />
            <MentionInput
              label="Descripción"
              value={editDescription}
              onChangeText={setEditDescription}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              multiline
              numberOfLines={3}
              familyMembers={familyMembers}
              currentUserId={currentUserId}
            />
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
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
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
