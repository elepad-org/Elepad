import React from "react";
import { TouchableOpacity, View, Dimensions, ImageBackground } from "react-native";
import { Image } from "expo-image";
import { Text, IconButton } from "react-native-paper";
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

const RecuerdoItemComponent = React.memo(({
  item,
  numColumns,
  onPress,
}: RecuerdoItemProps) => {
  const spacing = 19; // Espacio total horizontal
  const gap = 5; // Espacio entre items
  const itemSize =
    (screenWidth - spacing * 2 - gap * (numColumns - 1)) / numColumns;

  // Factor de escala para ajustar tamaños cuando hay más columnas
  const scale = 2 / numColumns; // 1 para 2 columnas, ~0.67 para 3 columnas

  // Factor de altura variable para estética Pinterest-like
  const heightFactor = (item.tipo === "texto" || item.tipo === "audio") ? 0.4 : (item.tipo === "imagen" || item.tipo === "video") ? 1.05 + (item.id.length % 3) * 0.05 : 0.8 + (item.id.length % 5) * 0.08; // 0.4 para texto y audio, 1.05 a 1.1 para imágenes y videos
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
        marginRight: gap,
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
          <View style={{ position: 'relative', flex: 4 }}>
            <Image
              source={item.tipo === "video" ? eleDef : { uri: item.miniatura }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 2, // BorderRadius pequeño para polaroid
              }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
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
                  color: COLORS.primary,
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
      ) : item.tipo === "texto" || item.tipo === "audio" ? (
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
          {((item.tipo === "texto" && item.titulo) || item.tipo === "audio") && (
            <View
              style={{
                bottom: 0,
                left: 0,
                right: 0,
                minHeight: 30,
                justifyContent: "center",
                alignItems: "flex-start",
                backgroundColor: "transparent", // Parte blanca abajo
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 12 * scale,
                  color: COLORS.primary,
                  paddingHorizontal: 5 * scale,
                  textAlign: "left",
                  fontFamily: "Montserrat", // Fuente principal de la app
                  fontWeight: "600",
                }}
              >
                {item.tipo === "audio" ? (item.titulo || "Nota de voz") : item.titulo}
              </Text>
            </View>)}
          {item.tipo === "audio" && (
            <IconButton
              icon="microphone"
              size={21 * scale}
              iconColor={COLORS.primary}
              style={{ position: "absolute", top: '50%', right: 12 * scale, transform: [{ translateY: -9 * scale }], margin: 0 }}
            />
          )}
        </ImageBackground>
      ) : null}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.numColumns === nextProps.numColumns &&
    prevProps.item.titulo === nextProps.item.titulo &&
    prevProps.item.miniatura === nextProps.item.miniatura
  );
});

RecuerdoItemComponent.displayName = "RecuerdoItemComponent";

export default RecuerdoItemComponent;
