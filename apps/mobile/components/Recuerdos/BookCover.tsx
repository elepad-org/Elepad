import { View, Image } from "react-native";
import { useGetMemories } from "@elepad/api-client";
import ChestIcon from "./ChestIcon";
import { COLORS } from "@/styles/base";

interface BookCoverProps {
  bookId: string;
  groupId: string;
  color: string;
}

export default function BookCover({ bookId, groupId, color }: BookCoverProps) {
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
  const imageMemories = memories.filter(
    (m: any) =>
      m.mimeType?.startsWith("image/") && m.mediaUrl
  ).slice(0, 4);

  // Si no hay imágenes, mostrar el SVG del cofre
  if (imageMemories.length === 0) {
    return (
      <View style={{ width: "92%", height: "92%" }}>
        <ChestIcon color={color} />
      </View>
    );
  }

  // Layout para 1 imagen: ocupa todo
  if (imageMemories.length === 1) {
    return (
      <Image
        source={{ uri: imageMemories[0].mediaUrl }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    );
  }

  // Layout para 2 imágenes: divididas verticalmente
  if (imageMemories.length === 2) {
    return (
      <View style={{ width: "100%", height: "100%", flexDirection: "row" }}>
        <Image
          source={{ uri: imageMemories[0].mediaUrl }}
          style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: imageMemories[1].mediaUrl }}
          style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Layout para 3 imágenes: 1 arriba (100% ancho), 2 abajo (50% cada una)
  if (imageMemories.length === 3) {
    return (
      <View style={{ width: "100%", height: "100%", flexDirection: "column" }}>
        <Image
          source={{ uri: imageMemories[0].mediaUrl }}
          style={{ width: "100%", height: "50%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
        <View style={{ width: "100%", height: "50%", flexDirection: "row" }}>
          <Image
            source={{ uri: imageMemories[1].mediaUrl }}
            style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
            resizeMode="cover"
          />
          <Image
            source={{ uri: imageMemories[2].mediaUrl }}
            style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  // Layout para 4 imágenes: cuadrícula 2x2
  return (
    <View style={{ width: "100%", height: "100%", flexDirection: "row", flexWrap: "wrap" }}>
      {imageMemories.map((memory: any, index: number) => (
        <Image
          key={memory.id}
          source={{ uri: memory.mediaUrl }}
          style={{
            width: "50%",
            height: "50%",
            borderWidth: 0.5,
            borderColor: COLORS.white,
          }}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}
