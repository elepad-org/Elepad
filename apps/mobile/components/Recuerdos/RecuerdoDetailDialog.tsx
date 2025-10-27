import { useState } from "react";
import { View, Image, ScrollView, Dimensions } from "react-native";
import { Dialog, Portal, Text, IconButton, Button } from "react-native-paper";
import { COLORS, STYLES, FONT } from "@/styles/base";
import { useAudioPlayer } from "expo-audio";
import CancelButton from "@/components/shared/CancelButton";

type RecuerdoTipo = "imagen" | "texto" | "audio";

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
  const player = useAudioPlayer(
    recuerdo?.tipo === "audio" ? recuerdo.contenido : "",
  );
  const [isPlaying, setIsPlaying] = useState(false);

  if (!recuerdo) return null;

  const playAudio = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    player.pause();
    player.seekTo(0);
    setIsPlaying(false);
  };

  const handleDismiss = () => {
    if (recuerdo.tipo === "audio") {
      stopAudio();
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
            borderRadius: 20,
            overflow: "hidden",
            maxHeight: screenWidth * 1.2,
            width: screenWidth * 0.92,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Contenido principal según el tipo */}
            {recuerdo.tipo === "imagen" && recuerdo.miniatura && (
              <View>
                <View style={{ padding: 10, paddingBottom: 0 }}>
                  <Image
                    source={{ uri: recuerdo.miniatura }}
                    style={{
                      width: "100%",
                      height: screenWidth * 0.84,
                      borderRadius: 12,
                    }}
                    resizeMode="cover"
                  />
                </View>

                {/* Información debajo de la imagen */}
                <View style={{ padding: 20, paddingTop: 16 }}>
                  {recuerdo.titulo && (
                    <Text style={STYLES.heading}>{recuerdo.titulo}</Text>
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
                    <Text style={STYLES.heading}>{recuerdo.titulo}</Text>
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
                    paddingVertical: 40,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    alignItems: "center",
                    minHeight: 200,
                    justifyContent: "center",
                  }}
                >
                  <IconButton
                    icon={isPlaying ? "pause-circle" : "play-circle"}
                    size={70}
                    iconColor={COLORS.primary}
                    onPress={playAudio}
                    style={{ margin: 0 }}
                  />
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 14,
                      marginTop: 8,
                    }}
                  >
                    {isPlaying ? "Reproduciendo..." : "Toca para reproducir"}
                  </Text>
                  {isPlaying && (
                    <Button
                      mode="text"
                      onPress={stopAudio}
                      textColor={COLORS.primary}
                      compact
                    >
                      Detener
                    </Button>
                  )}
                </View>

                {/* Información debajo del audio */}
                <View style={{ padding: 20, paddingTop: 16 }}>
                  {recuerdo.titulo && (
                    <Text style={STYLES.heading}>{recuerdo.titulo}</Text>
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

            {/* Botón de cerrar */}
            <View style={{ paddingBottom: 12, alignItems: "center" }}>
              <CancelButton onPress={handleDismiss} text="Cerrar" />
            </View>
          </ScrollView>
        </View>
      </Dialog>
    </Portal>
  );
}
