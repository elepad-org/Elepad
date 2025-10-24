import { TouchableOpacity, View, Dimensions, Image } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";

const screenWidth = Dimensions.get("window").width;

type RecuerdoTipo = "imagen" | "texto" | "audio";

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
}

export default function RecuerdoItemComponent({
  item,
  numColumns,
}: RecuerdoItemProps) {
  const spacing = 16; // Espacio total horizontal
  const gap = 4; // Espacio entre items
  const itemSize =
    (screenWidth - spacing * 2 - gap * (numColumns - 1)) / numColumns;

  return (
    <TouchableOpacity
      style={{
        width: itemSize,
        height: itemSize,
        marginBottom: 4, // Separación vertical más junta
        marginRight: gap,
        padding: 0,
        overflow: "hidden",
        borderRadius: 8,
        backgroundColor: "#F5F5F5", // Fondo gris para todos
      }}
    >
      {item.tipo === "imagen" && item.miniatura ? (
        <View style={{ flex: 1, width: "100%", height: "100%" }}>
          <Image
            source={{ uri: item.miniatura }}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "cover",
            }}
          />
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
        <View
          style={[
            STYLES.center,
            { backgroundColor: COLORS.accent, flex: 1, padding: 12 },
          ]}
        >
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text
            numberOfLines={3}
            style={[STYLES.footerText, { textAlign: "center", marginTop: 4 }]}
          >
            {item.titulo || "Nota de texto"}
          </Text>
        </View>
      ) : (
        <View
          style={[
            STYLES.center,
            { backgroundColor: "#F5F5F5", flex: 1, padding: 12 },
          ]}
        >
          <IconButton icon="microphone" size={32} iconColor="#9E9E9E" />
          <Text
            numberOfLines={2}
            style={[
              STYLES.footerText,
              { textAlign: "center", marginTop: 4, color: "#616161" },
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
