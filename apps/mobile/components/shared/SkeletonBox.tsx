import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { COLORS } from "@/styles/base";

interface SkeletonBoxProps {
  /**
   * Ancho del skeleton - puede ser número (px) o string ("100%", "80%", etc.)
   */
  width: number | string;
  /**
   * Altura del skeleton en píxeles
   */
  height: number;
  /**
   * Radio de borde para las esquinas
   * @default 8
   */
  borderRadius?: number;
  /**
   * Estilos adicionales para el skeleton
   */
  style?: ViewStyle;
}

/**
 * Componente Skeleton con animación de pulsación
 * 
 * @description
 * Crea una caja animada que simula contenido cargándose.
 * Se puede usar para diferentes tipos de contenido:
 * - Texto: width variable (60%-100%), height pequeño (14-18px)
 * - Avatar: width y height iguales, borderRadius alto (width/2 para círculo)
 * - Imagen: width grande o 100%, height según proporción deseada
 * - Tarjeta: width 100%, height según diseño
 * 
 * @example
 * // Skeleton para texto (título)
 * <SkeletonBox width="80%" height={18} borderRadius={4} />
 * 
 * @example
 * // Skeleton circular para avatar
 * <SkeletonBox width={60} height={60} borderRadius={30} />
 * 
 * @example
 * // Skeleton para imagen de tarjeta
 * <SkeletonBox width="100%" height={200} borderRadius={12} />
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  // Valor animado que controla la opacidad del skeleton
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Crear animación de loop infinito con pulsación
    Animated.loop(
      Animated.sequence([
        // Fade in: de 0.3 a 1 en 800ms
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true, // Mejor performance
        }),
        // Fade out: de 1 a 0.3 en 800ms
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          width: width as number | `${number}%`,
          height,
          borderRadius,
          backgroundColor: COLORS.textSecondary + "20", // Color gris claro con transparencia
        },
        {
          opacity, // Opacidad animada - separada para evitar conflictos de tipos
        },
      ]}
    />
  );
};

export default SkeletonBox;
