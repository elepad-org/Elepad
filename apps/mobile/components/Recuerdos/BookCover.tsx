import { View, StyleSheet, Animated } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { useGetMemories } from "@elepad/api-client";
import { useEffect, useRef, useState, useMemo } from "react";
import ChestIcon from "./ChestIcon";
import { COLORS, FONT } from "@/styles/base";

interface BookCoverProps {
  bookId: string;
  groupId: string;
  color: string;
  title: string;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function parseHexColor(input: string) {
  const hex = input.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const raw = match[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const hh = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hh(Math.round(r))}${hh(Math.round(g))}${hh(Math.round(b))}`;
}

function mix(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  const tt = clamp01(t);
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  };
}

export default function BookCover({ bookId, groupId, color, title }: BookCoverProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState(0);

  // Calclular colores estilo ChestIcon
  const base = color ? parseHexColor(color) : null;
  const defaultWood = parseHexColor("#CD9965");
  const woodFill =
    base && defaultWood
      ? toHex(mix(base, { r: 255, g: 255, b: 255 }, 0.35))
      : "#CD9965";

  const { data: memoriesResponse } = useGetMemories(
    {
      groupId,
      bookId,
      limit: 20,
    },
    {
      query: {
        enabled: !!groupId && !!bookId,
      },
    }
  );

  // Extraer los datos de la respuesta
  const memoriesPayload =
    memoriesResponse && "data" in memoriesResponse
      ? (memoriesResponse as unknown as { data: unknown }).data
      : undefined;

  const memoriesData = Array.isArray(memoriesPayload)
    ? memoriesPayload
    : memoriesPayload &&
      typeof memoriesPayload === "object" &&
      "data" in (memoriesPayload as Record<string, unknown>)
      ? (memoriesPayload as { data: unknown }).data
      : [];

  const memories = Array.isArray(memoriesData) ? memoriesData : [];

  // Filtrar solo las memorias con imágenes
  const imageMemories = useMemo(
    () =>
      memories
        .filter(
          (m: { mimeType?: string; mediaUrl?: string }) =>
            m.mimeType?.startsWith("image/") && m.mediaUrl
        )
        .slice(0, 20),
    [memories]
  ); // Traer hasta 20 para el carrusel

  // Ping-Pong Logic
  // Bottom Layer Index: 0, 2, 2, 4, 4...
  // Top Layer Index:    1, 1, 3, 3, 5...

  // Calculate indices based on step
  // We use modulo manually on the slice, or just modulo the start index
  const totalImages = imageMemories.length;

  const getBatch = (startIndex: number) => {
    if (totalImages === 0) return [];
    if (totalImages <= 4) return imageMemories;

    const batch = [];
    for (let i = 0; i < 4; i++) {
      batch.push(imageMemories[(startIndex + i) % totalImages]);
    }
    return batch;
  };

  // Step 0: Bot=0, Top=4. Opacity 0. (Wait -> Fade Top In) -> Step 1
  // Step 1: Bot=4, Top=4. Opacity 1. (Wait -> Fade Top Out) -> Step 2
  // Step 2: Bot=4, Top=8. Opacity 0. (Wait -> Fade Top In) -> Step 3

  // Note: Indices advance by 4.
  // Correction:
  // S=0. Visible: Bot(0). Hidden: Top(4). Anim: Fade In Top. 
  //   -> Top becomes visible (showing 4). Bot can update to 8.
  // S=1. Visible: Top(4). Hidden: Bot(8). Anim: Fade Out Top (Reveal Bot).
  //   -> Bot becomes visible (showing 8). Top can update to 12.

  // S=0: Bot 0. Top 4.
  // S=1: Bot 8. Top 4.
  // S=2: Bot 8. Top 12.
  // S=3: Bot 16. Top 12.

  // Pattern:
  // Bot: 0, 8, 8, 16, 16... -> Sequence 0, 2, 2, 4, 4... -> floor((s+1)/2)*2 * 4
  // Top: 4, 4, 12, 12, 20... -> Sequence 1, 1, 3, 3, 5... -> (floor(s/2)*2 + 1) * 4

  const bottomImages = useMemo(() => getBatch(Math.floor((step + 1) / 2) * 8), [step, imageMemories]);
  const topImages = useMemo(() => getBatch((Math.floor(step / 2) * 8) + 4), [step, imageMemories]);

  useEffect(() => {
    if (imageMemories.length <= 4) return;

    // Time to wait before starting transition
    const timeout = setTimeout(() => {
      const toOpacity = step % 2 === 0 ? 1 : 0;

      Animated.timing(fadeAnim, {
        toValue: toOpacity,
        duration: 800,
        useNativeDriver: true,
        isInteraction: false,
      }).start(({ finished }) => {
        if (finished) {
          setStep((s) => s + 1);
        }
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [step, imageMemories.length]); // Depend on Step to trigger next cycle

  // Si no hay imágenes, mostrar el SVG del cofre con el título
  if (imageMemories.length === 0) {
    return (
      <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: "92%", height: "92%" }}>
          <ChestIcon color={color} />
        </View>
        <View style={{ position: "absolute", top: "15%", paddingHorizontal: 16 }}>
          <Text numberOfLines={1} style={[styles.chestTitle, { color: '#2b1a17' }]}>{title}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Capa inferior: Imágenes actuales con margen para el diseño del baúl */}
      <View style={[styles.absFill, { paddingTop: '24%', paddingBottom: '8%' }]}>
        <ImageGrid images={bottomImages} />
      </View>

      {/* Capa superior: Siguientes imágenes (animación de opacidad) */}
      <Animated.View style={[styles.absFill, { opacity: fadeAnim, paddingTop: '24%', paddingBottom: '8%' }]}>
        <ImageGrid images={topImages} />
      </Animated.View>

      {/* Superposición del Baul (diseño estético) */}
      <View style={styles.chestOverlay} pointerEvents="none">
        {/* Tapa del baúl (arriba) - más alta y redondeada */}
        <View style={[styles.chestTop, { backgroundColor: woodFill }]}>
          <Text numberOfLines={1} style={[styles.chestTitle, { color: '#2b1a17' }]}>{title}</Text>
        </View>
        
        {/* Parte inferior del baúl (abajo) - rectangular simple */}
        <View style={[styles.chestBottom, { backgroundColor: woodFill }]} />
        
        {/* Candado central estilizado */}
        <View style={styles.lockPiece} />
      </View>
    </View>
  );
}

// Componente helper para renderizar un grid de imágenes (Extracted to prevent re-creation)
const ImageGrid = ({ images }: { images: { id: string; mediaUrl: string }[] }) => {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0].mediaUrl }}
        style={styles.fullSize}
        contentFit="cover"
        transition={200}
      />
    );
  }

  if (images.length === 2) {
    return (
      <View style={styles.row}>
        <Image
          source={{ uri: images[0].mediaUrl }}
          style={styles.halfWidth}
          contentFit="cover"
          transition={200}
        />
        <Image
          source={{ uri: images[1].mediaUrl }}
          style={styles.halfWidth}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  if (images.length === 3) {
    return (
      <View style={styles.col}>
        <Image
          source={{ uri: images[0].mediaUrl }}
          style={styles.halfHeight}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.rowHalfHeight}>
          <Image
            source={{ uri: images[1].mediaUrl }}
            style={styles.halfWidth}
            contentFit="cover"
            transition={200}
          />
          <Image
            source={{ uri: images[2].mediaUrl }}
            style={styles.halfWidth}
            contentFit="cover"
            transition={200}
          />
        </View>
      </View>
    );
  }

  // 4 imágenes
  return (
    <View style={styles.grid}>
      {images.slice(0, 4).map((memory: { id: string; mediaUrl: string }) => (
        <Image
          key={memory.id}
          source={{ uri: memory.mediaUrl }}
          style={styles.gridItem}
          contentFit="cover"
          transition={200}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  absFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backgroundSecondary, // Fondo para evitar ver atrás durante transiciones si las imágenes son transparentes (no debería pasar)
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  row: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
  },
  col: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
  },
  halfWidth: {
    width: "50%",
    height: "100%",
    borderWidth: 0.5,
    borderColor: COLORS.white,
  },
  halfHeight: {
    width: "100%",
    height: "50%",
    borderWidth: 0.5,
    borderColor: COLORS.white,
  },
  rowHalfHeight: {
    width: "100%",
    height: "50%",
    flexDirection: "row",
  },
  grid: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "50%",
    height: "50%",
    borderWidth: 0.5,
    borderColor: COLORS.white,
  },
  chestOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  chestTop: {
    height: "24%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 3,
    borderBottomColor: "rgba(0,0,0,0.3)",
    zIndex: 2,
  },
  chestTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  chestBottom: {
    height: "8%",
    width: "100%",
    borderTopWidth: 2,
    borderTopColor: "rgba(0,0,0,0.25)",
    zIndex: 2,
  },
  lockPiece: {
    position: "absolute",
    top: "20%",
    left: "45%",
    width: "10%",
    height: "8%",
    backgroundColor: "#4E342E",
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 3,
  },
});
