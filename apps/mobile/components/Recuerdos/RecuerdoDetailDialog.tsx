import { useState, useEffect, useRef } from "react";
import { View, Image, Dimensions, StyleSheet } from "react-native";
import { Dialog, Portal, Text, IconButton, Button } from "react-native-paper";
import { COLORS, STYLES, FONT } from "@/styles/base";
import { useAudioPlayer } from "expo-audio";
import { Video, ResizeMode } from "expo-av";
import Slider from "@react-native-community/slider";
import CancelButton from "@/components/shared/CancelButton";

type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  descripcion?: string;
  fecha: Date;
}

interface RecuerdoDetailDialogProps {
  visible: boolean;
  recuerdo: Recuerdo | null;
  onDismiss: () => void;
}

const screenWidth = Dimensions.get("window").width;

export default function RecuerdoDetailDialog({
  visible,
  recuerdo,
  onDismiss,
}: RecuerdoDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioUrl = recuerdo?.tipo === "audio" ? recuerdo.contenido : "";
  const player = useAudioPlayer(audioUrl);
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<any>({});

  // Resetear el player cuando se abre el modal
  useEffect(() => {
    if (visible && recuerdo?.tipo === "audio") {
      console.log("Modal opened, resetting player");
      player.pause();
      player.seekTo(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }

    // Resetear video si existe
    if (visible && recuerdo?.tipo === "video" && videoRef.current) {
      videoRef.current.setPositionAsync(0);
      videoRef.current.pauseAsync();
    }
  }, [visible, recuerdo, player]);

  useEffect(() => {
    // Sincronizar estado con el player
    const checkStatus = () => {
      setIsPlaying(player.playing);
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, [player]);

  // Limpiar el player cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (recuerdo?.tipo === "audio" && player) {
        try {
          console.log("Cleaning up player");
          if (player.playing) {
            player.pause();
          }
          player.seekTo(0);
        } catch (error) {
          console.log("Player already cleaned up");
        }
      }
    };
  }, [player, recuerdo]);

  if (!recuerdo) return null;

  const playAudio = () => {
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
    if (recuerdo.tipo === "audio") {
      stopAudio();
    }
    if (recuerdo.tipo === "video" && videoRef.current) {
      videoRef.current.pauseAsync();
    }
    onDismiss();
  };

  return (
    <Portal>
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
              <View style={{ padding: 20, paddingTop: 16 }}>
                {recuerdo.titulo && (
                  <Text style={{ ...STYLES.heading, textAlign: "left" }}>
                    {recuerdo.titulo}
                  </Text>
                )}

                {recuerdo.descripcion && (
                  <Text
                    style={{
                      ...STYLES.subheading,
                      marginTop: 8,
                      textAlign: "left",
                    }}
                  >
                    {recuerdo.descripcion}
                  </Text>
                )}

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
            </View>
          )}

          {recuerdo.tipo === "video" && recuerdo.contenido && (
            <View>
              <View style={{ padding: 14, paddingBottom: 0 }}>
                <Video
                  ref={videoRef}
                  source={{ uri: recuerdo.contenido }}
                  style={{
                    width: "100%",
                    height: screenWidth * 0.84,
                    borderRadius: 0,
                  }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onPlaybackStatusUpdate={(status) =>
                    setVideoStatus(() => status)
                  }
                />
              </View>

              {/* Información debajo del video */}
              <View style={{ padding: 20, paddingTop: 16 }}>
                {recuerdo.titulo && (
                  <Text style={{ ...STYLES.heading, textAlign: "left" }}>
                    {recuerdo.titulo}
                  </Text>
                )}

                {recuerdo.descripcion && (
                  <Text
                    style={{
                      ...STYLES.subheading,
                      marginTop: 8,
                      textAlign: "left",
                    }}
                  >
                    {recuerdo.descripcion}
                  </Text>
                )}

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
            </View>
          )}

          {recuerdo.tipo === "texto" && (
            <View>
              <View
                style={{
                  backgroundColor: COLORS.accent,
                  padding: 20,
                  paddingTop: 30,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  minHeight: 180,
                }}
              >
                <Text style={STYLES.paragraphText}>{recuerdo.contenido}</Text>
              </View>

              {/* Información debajo del texto */}
              <View style={{ padding: 20, paddingTop: 16 }}>
                {recuerdo.titulo && (
                  <Text style={{ ...STYLES.heading, textAlign: "left" }}>
                    {recuerdo.titulo}
                  </Text>
                )}

                {recuerdo.descripcion && (
                  <Text
                    style={{
                      ...STYLES.subheading,
                      marginTop: 8,
                      textAlign: "left",
                    }}
                  >
                    {recuerdo.descripcion}
                  </Text>
                )}

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
              <View style={{ padding: 20, paddingTop: 16 }}>
                {recuerdo.titulo && (
                  <Text style={{ ...STYLES.heading, textAlign: "left" }}>
                    {recuerdo.titulo}
                  </Text>
                )}

                {recuerdo.descripcion && (
                  <Text
                    style={{
                      ...STYLES.subheading,
                      marginTop: 8,
                      textAlign: "left",
                    }}
                  >
                    {recuerdo.descripcion}
                  </Text>
                )}

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
            </View>
          )}
        </View>
      </Dialog>
    </Portal>
  );
}
