import React from "react";
import {
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Text, IconButton } from "react-native-paper";
import { useVideoPlayer, VideoView } from "expo-video";
import { COLORS, SHADOWS } from "@/styles/base";
import fondoRecuerdos from "@/assets/images/fondoRecuerdos.png";
import eleDef from "@/assets/images/ele-def.png";

const screenWidth = Dimensions.get("window").width;

type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  fecha: Date;
}

interface RecuerdoItemProps {
  item: Recuerdo;
  numColumns: number;
  onPress: (item: Recuerdo) => void;
}

const VideoItem = ({
  uri,
  style,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
}) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = true;
    player.timeUpdateEventInterval = 1000;
  });

  // Seek to a frame to show a preview (avoiding 0 which might be black)
  React.useEffect(() => {
    if (player) {
      // Small delay to ensure player is ready
      setTimeout(() => {
        try {
          player.currentTime = 0.1;
        } catch {
          // ignore
        }
      }, 100);
    }
  }, [player]);

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls={false}
      contentFit="cover"
    />
  );
};

const RecuerdoItemComponent = React.memo(
  ({ item, numColumns, onPress }: RecuerdoItemProps) => {
    const spacing = 20; // Espacio total horizontal del contenedor (padding)
    const gap = 8; // Espacio entre items
    const itemSize = (screenWidth - spacing * 2) / numColumns - gap;

    // Factor de escala para ajustar tamaños cuando hay más columnas
    const scale = 2 / numColumns; // 1 para 2 columnas, ~0.67 para 3 columnas

    // Factor de altura variable para estética Pinterest-like
    const heightFactor =
      item.tipo === "audio"
        ? 0.54
        : item.tipo === "texto"
          ? 0.4
          : item.tipo === "imagen" || item.tipo === "video"
            ? 1.05 + (item.id.length % 3) * 0.05
            : 0.8 + (item.id.length % 5) * 0.08; // 0.85 para audio (cassette completo), 0.4 para texto, 1.05 a 1.1 para imágenes y videos
    const itemHeight = itemSize * heightFactor;

    const isMedia = item.tipo === "imagen" || item.tipo === "video";

    return (
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        style={{
          width: itemSize,
          height: itemHeight,
          marginBottom: gap, // Separación vertical
          marginHorizontal: gap / 2, // Margen horizontal para centrar el gap
          paddingTop: isMedia ? 6 : 0,
          paddingLeft: isMedia ? 6 : 0,
          paddingRight: isMedia ? 6 : 0,
          paddingBottom: 0, // No padding abajo
          overflow: "hidden",
          borderRadius: 8,
          backgroundColor: isMedia ? "#FFFFFF" : "#F5F5F5", // Blanco para imágenes y videos, gris para otros
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)", // Borde sutil sombreado
          ...SHADOWS.light, // Sombra para polaroid
        }}
      >
        {isMedia && item.miniatura ? (
          <View style={{ flex: 1, width: "100%", height: "100%" }}>
            <View style={{ position: "relative", flex: 4 }}>
              {item.tipo === "video" && item.miniatura ? (
                <VideoItem
                  uri={item.miniatura}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 2,
                  }}
                />
              ) : (
                <Image
                  source={
                    item.tipo === "video" ? eleDef : { uri: item.miniatura }
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 2, // BorderRadius pequeño para polaroid
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              )}
              {item.tipo === "video" && (
                /* Ícono de play para indicar que es un video */
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 40 * scale,
                      width: 50 * scale,
                      height: 50 * scale,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      icon="play"
                      size={28 * scale}
                      iconColor="#fff"
                      style={{ margin: 0 }}
                    />
                  </View>
                </View>
              )}
            </View>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "flex-start",
                backgroundColor: "transparent", // Parte blanca abajo
              }}
            >
              {item.titulo && (
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11 * scale,
                    color: "#000000",
                    textAlign: "left",
                    paddingHorizontal: 10 * scale,
                    fontFamily: "Montserrat", // Fuente principal de la app
                    fontWeight: "600",
                  }}
                >
                  {item.titulo}
                </Text>
              )}
            </View>
          </View>
        ) : item.tipo === "audio" ? (
          // Diseño tipo cassette vintage para audio
          <View
            style={{
              flex: 1,
              backgroundColor: "#1a1a1a",
              borderRadius: 4,
              padding: 8 * scale,
              justifyContent: "space-between",
            }}
          >
            {/* Etiqueta superior estilo cassette */}
            <View
              style={{
                backgroundColor: "#e8e8e8",
                borderRadius: 2,
                padding: 6 * scale,
                borderWidth: 1,
                borderColor: "#c0c0c0",
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 9 * scale,
                  color: "#1a1a1a",
                  textAlign: "center",
                  fontFamily: "Montserrat",
                  fontWeight: "600",
                }}
              >
                {item.titulo || "Nota de voz"}
              </Text>
            </View>

            {/* Ruedas del cassette conectadas */}
            <View
              style={{
                paddingVertical: 8 * scale,
                alignItems: "center",
              }}
            >
              {/* Rectángulo que conecta las ruedas (ventana del cassette) */}
              <View
                style={{
                  width: "85%",
                  height: 40 * scale,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20 * scale,
                  borderWidth: 1.5 * scale,
                  borderColor: "#4a4a4a",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 4 * scale,
                }}
              >
                {/* Rueda izquierda */}
                <View
                  style={{
                    width: 32 * scale,
                    height: 32 * scale,
                    borderRadius: 16 * scale,
                    borderWidth: 2 * scale,
                    borderColor: "#4a4a4a",
                    backgroundColor: "#1a1a1a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 12 * scale,
                      height: 12 * scale,
                      borderRadius: 6 * scale,
                      backgroundColor: "#d0d0d0",
                    }}
                  />
                </View>

                {/* Ventana central del cassette */}
                <View
                  style={{
                    width: 50 * scale,
                    height: 20 * scale,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 2 * scale,
                    borderWidth: 1 * scale,
                    borderColor: "#4a4a4a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: "80%",
                      height: 2 * scale,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                </View>

                {/* Rueda derecha */}
                <View
                  style={{
                    width: 32 * scale,
                    height: 32 * scale,
                    borderRadius: 16 * scale,
                    borderWidth: 2 * scale,
                    borderColor: "#4a4a4a",
                    backgroundColor: "#1a1a1a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 12 * scale,
                      height: 12 * scale,
                      borderRadius: 6 * scale,
                      backgroundColor: "#d0d0d0",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : item.tipo === "texto" ? (
          <ImageBackground
            source={fondoRecuerdos}
            style={{
              flex: 1,
              padding: 12 * scale,
              justifyContent: "center",
              alignItems: "flex-start",
              borderRadius: 4,
            }}
            resizeMode="cover"
          >
            {item.titulo && (
              <View
                style={{
                  bottom: 0,
                  left: 0,
                  right: 0,
                  minHeight: 30,
                  justifyContent: "center",
                  alignItems: "flex-start",
                  backgroundColor: "transparent",
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 12 * scale,
                    color: "#000000",
                    paddingHorizontal: 5 * scale,
                    textAlign: "left",
                    fontFamily: "Montserrat",
                    fontWeight: "600",
                  }}
                >
                  {item.titulo}
                </Text>
              </View>
            )}
          </ImageBackground>
        ) : null}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.numColumns === nextProps.numColumns &&
      prevProps.item.titulo === nextProps.item.titulo &&
      prevProps.item.miniatura === nextProps.item.miniatura
    );
  },
);

RecuerdoItemComponent.displayName = "RecuerdoItemComponent";

export default RecuerdoItemComponent;
