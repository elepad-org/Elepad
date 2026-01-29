import { TouchableOpacity, View, Dimensions, Image, ImageBackground } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { STYLES, COLORS, SHADOWS } from "@/styles/base";
import fondoRecuerdos from "@/assets/images/fondoRecuerdos.png";

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

export default function RecuerdoItemComponent({
  item,
  numColumns,
  onPress,
}: RecuerdoItemProps) {
  const spacing = 16; // Espacio total horizontal
  const gap = 4; // Espacio entre items
  const itemSize =
    (screenWidth - spacing * 2 - gap * (numColumns - 1)) / numColumns;

  // Factor de altura variable para estética Pinterest-like
  const heightFactor = item.tipo === "texto" ? 0.45 : item.tipo === "imagen" ? 1.0 + (item.id.length % 3) * 0.05 : 0.8 + (item.id.length % 5) * 0.08; // 1.0 a 1.1 para imágenes, 0.5 para texto, 0.8 a 1.16 para videos/audio
  const itemHeight = itemSize * heightFactor;

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={{
        width: itemSize,
        height: itemHeight,
        marginBottom: 4, // Separación vertical más junta
        marginRight: gap,
        padding: item.tipo === "imagen" ? 6 : 0, // Padding solo para imágenes polaroid
        overflow: "hidden",
        borderRadius: 4,
        backgroundColor: item.tipo === "imagen" ? "#FFFFFF" : "#F5F5F5", // Blanco para imágenes, gris para otros
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)", // Borde sutil sombreado
        ...SHADOWS.light, // Sombra para polaroid
      }}
    >
      {item.tipo === "imagen" && item.miniatura ? (
        <View style={{ flex: 1, width: "100%", height: "100%" }}>
          <Image
            source={{ uri: item.miniatura }}
            style={{
              width: "100%",
              height: item.titulo ? "80%" : "100%", // Dejar espacio abajo si hay título
              resizeMode: "cover",
              borderRadius: 2, // BorderRadius pequeño para polaroid
            }}
          />
          {item.titulo && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                minHeight: 30,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent", // Parte blanca abajo
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  color: COLORS.primary,
                  textAlign: "center",
                  fontFamily: "Montserrat", // Fuente principal de la app
                }}
              >
                {item.titulo}
              </Text>
            </View>
          )}
        </View>
      ) : item.tipo === "video" && item.miniatura ? (
        <View style={{ flex: 1, width: "100%", height: "100%" }}>
          <Image
            source={{ uri: item.miniatura }}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "cover",
            }}
          />
          {/* Ícono de play para indicar que es un video */}
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
                borderRadius: 40,
                width: 60,
                height: 60,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton
                icon="play"
                size={30}
                iconColor="#fff"
                style={{ margin: 0 }}
              />
            </View>
          </View>
          {item.titulo && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: 6,
                borderRadius: 4,
              }}
            >
              <Text
                numberOfLines={2}
                style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}
              >
                {item.titulo}
              </Text>
            </View>
          )}
        </View>
      ) : item.tipo === "texto" ? (
        <ImageBackground
          source={fondoRecuerdos}
          style={{
            flex: 1,
            padding: 12,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 4,
          }}
        >
          {item.titulo && (
            <Text
              numberOfLines={3}
              style={{
                color: COLORS.primary,
                fontSize: 14,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {item.titulo}
            </Text>
          )}
        </ImageBackground>
      ) : (
        <View
          style={[
            STYLES.center,
            { backgroundColor: COLORS.backgroundSecondary, flex: 1, padding: 12 },
          ]}
        >
          <IconButton
            icon="microphone"
            size={32}
            iconColor={COLORS.primary}
          />
          <Text
            numberOfLines={2}
            style={[
              STYLES.footerText,
              { textAlign: "center", marginTop: 4, color: COLORS.textLight },
            ]}
          >
            {item.titulo || "Nota de voz"}
          </Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingHorizontal: 6,
          paddingVertical: 4,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "500" }}>
          {item.fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
