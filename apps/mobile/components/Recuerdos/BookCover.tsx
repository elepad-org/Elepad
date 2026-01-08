import { View, Image, Animated } from "react-native";
import { useGetMemories } from "@elepad/api-client";
import { useEffect, useRef, useState } from "react";
import ChestIcon from "./ChestIcon";
import { COLORS } from "@/styles/base";

interface BookCoverProps {
  bookId: string;
  groupId: string;
  color: string;
}

export default function BookCover({ bookId, groupId, color }: BookCoverProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
  ).slice(0, 20); // Traer hasta 20 para el carrusel

  // Efecto carrusel con slide para cambiar imágenes automáticamente
  useEffect(() => {
    if (imageMemories.length <= 4) return; // Solo animar si hay más de 4 imágenes

    const interval = setInterval(() => {
      // Fade out gradual
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Cambiar índice mientras está invisible
        setCurrentIndex((prev) => (prev + 4) % imageMemories.length);
        
        // Fade in gradual
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [imageMemories.length, fadeAnim]);

  // Si no hay imágenes, mostrar el SVG del cofre
  if (imageMemories.length === 0) {
    return (
      <View style={{ width: "92%", height: "92%" }}>
        <ChestIcon color={color} />
      </View>
    );
  }

  // Obtener las 4 imágenes actuales del carrusel
  const displayImages = imageMemories.slice(currentIndex, currentIndex + 4);
  
  // Layout para 1 imagen: ocupa todo
  if (displayImages.length === 1) {
    return (
      <Animated.Image
        source={{ uri: displayImages[0].mediaUrl }}
        style={{ 
          width: "100%", 
          height: "100%", 
          opacity: fadeAnim
        }}
        resizeMode="cover"
      />
    );
  }

  // Layout para 2 imágenes: divididas verticalmente
  if (displayImages.length === 2) {
    return (
      <Animated.View style={{ 
        width: "100%", 
        height: "100%", 
        flexDirection: "row", 
        opacity: fadeAnim
      }}>
        <Image
          source={{ uri: displayImages[0].mediaUrl }}
          style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: displayImages[1].mediaUrl }}
          style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
      </Animated.View>
    );
  }

  // Layout para 3 imágenes: 1 arriba (100% ancho), 2 abajo (50% cada una)
  if (displayImages.length === 3) {
    return (
      <Animated.View style={{ 
        width: "100%", 
        height: "100%", 
        flexDirection: "column", 
        opacity: fadeAnim
      }}>
        <Image
          source={{ uri: displayImages[0].mediaUrl }}
          style={{ width: "100%", height: "50%", borderWidth: 0.5, borderColor: COLORS.white }}
          resizeMode="cover"
        />
        <View style={{ width: "100%", height: "50%", flexDirection: "row" }}>
          <Image
            source={{ uri: displayImages[1].mediaUrl }}
            style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
            resizeMode="cover"
          />
          <Image
            source={{ uri: displayImages[2].mediaUrl }}
            style={{ width: "50%", height: "100%", borderWidth: 0.5, borderColor: COLORS.white }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    );
  }

  // Layout para 4 imágenes: cuadrícula 2x2
  return (
    <Animated.View style={{ 
      width: "100%", 
      height: "100%", 
      flexDirection: "row", 
      flexWrap: "wrap", 
      opacity: fadeAnim
    }}>
      {displayImages.slice(0, 4).map((memory: any) => (
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
    </Animated.View>
  );
}
