import React from "react";
import { TouchableOpacity, View, Dimensions } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";

const screenWidth = Dimensions.get("window").width;
const numColumns = 2;
const itemSize = (screenWidth - 48) / numColumns;

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
}

export default function RecuerdoItemComponent({ item }: RecuerdoItemProps) {
  return (
    <TouchableOpacity
      style={[STYLES.card, { width: itemSize, height: itemSize, margin: 4 }]}
    >
      {item.tipo === "imagen" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="image" size={32} iconColor={COLORS.primary} />
          <Text numberOfLines={2} style={STYLES.footerText}>
            {item.titulo || "Imagen"}
          </Text>
        </View>
      )}
      {item.tipo === "texto" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text numberOfLines={2} style={STYLES.footerText}>
            {item.titulo || "Nota de texto"}
          </Text>
        </View>
      )}
      {item.tipo === "audio" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="microphone" size={24} iconColor={COLORS.primary} />
          <Text numberOfLines={2} style={STYLES.footerText}>
            {item.titulo || "Nota de voz"}
          </Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 4,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 10 }}>
          {item.fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
