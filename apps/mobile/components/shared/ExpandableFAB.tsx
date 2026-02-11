import { useState, useEffect, forwardRef } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { IconButton } from "react-native-paper";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor } from "react-native-reanimated";
import { COLORS, SHADOWS } from "@/styles/base";

interface ExpandableFABProps {
  /** Texto que se muestra cuando el FAB está expandido */
  label: string;
  /** Nombre del icono (react-native-paper icon) */
  icon: string;
  /** Callback que se ejecuta cuando el FAB está expandido y se presiona */
  onPress: () => void;
  /** Color de fondo del círculo del FAB */
  backgroundColor?: string;
  /** Color del icono */
  iconColor?: string;
  /** Color del texto */
  textColor?: string;
  /** Color de fondo de la parte expandible */
  expandedBackgroundColor?: string;
  /** Posición desde la parte inferior de la pantalla */
  bottom?: number;
  /** Posición desde el lado derecho de la pantalla */
  right?: number;
  /** Ancho de la parte expandible */
  expandedWidth?: number;
  /** Tiempo en ms antes de colapsar automáticamente (0 para desactivar) */
  autoCollapseDelay?: number;
}

export const ExpandableFAB = forwardRef<View, ExpandableFABProps>(
  (
    {
      label,
      icon,
      onPress,
      backgroundColor = COLORS.primary,
      iconColor = COLORS.white,
      textColor = COLORS.primary,
      expandedBackgroundColor = COLORS.white,
      bottom = 16,
      right = 16,
      expandedWidth = 130,
      autoCollapseDelay = 3000,
    },
    ref
  ) => {
    const [isExtended, setIsExtended] = useState(false);
    const fabAnim = useSharedValue(0);

  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      // Animar ancho desde 0 a expandedWidth, creciendo hacia la izquierda
      width: fabAnim.value * expandedWidth,
      // Opacidad suave para que el texto aparezca gradualmente
      opacity: fabAnim.value,
    };
  });

  // Estilo animado para el color del círculo
  const circleAnimatedStyle = useAnimatedStyle(() => {
    const animatedColor = interpolateColor(
      fabAnim.value,
      [0, 1],
      [backgroundColor, COLORS.secondary]
    );
    return {
      backgroundColor: animatedColor,
    };
  });

  // Auto-colapsar el FAB después del delay especificado
  useEffect(() => {
    if (isExtended) {
      // Expandir con animación suave
      fabAnim.value = withSpring(1, { damping: 20, stiffness: 90 });

      if (autoCollapseDelay > 0) {
        const timer = setTimeout(() => {
          setIsExtended(false);
        }, autoCollapseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      // Colapsar con animación suave
      fabAnim.value = withSpring(0, { damping: 20, stiffness: 90 });
    }
  }, [isExtended, autoCollapseDelay, expandedWidth]);

  const handlePress = () => {
    if (isExtended) {
      // Si ya está expandido, ejecutar la acción
      onPress();
    } else {
      // Si está colapsado, expandir
      setIsExtended(true);
    }
  };

  return (
    <View
      ref={ref}
      style={{
        position: "absolute",
        right,
        bottom,
      }}
    >
      {/* Parte expandible - Crece desde el centro del círculo */}
      <Animated.View
        style={[
          {
            position: "absolute",
            right: 28, // Alineado con el centro del círculo (56/2)
            backgroundColor: expandedBackgroundColor,
            borderTopLeftRadius: 28,
            borderBottomLeftRadius: 28,
            height: 56,
            justifyContent: "center",
            paddingLeft: 20,
            overflow: "hidden",
            zIndex: 1,
            ...SHADOWS.medium,
          },
          fabAnimatedStyle,
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            color: textColor,
            fontSize: 16,
            fontWeight: "600",
            minWidth: expandedWidth - 20, // Ancho mínimo para evitar wrapping
          }}
        >
          {label}
        </Text>
      </Animated.View>

      {/* Círculo - Siempre al frente */}
      <Animated.View
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
            ...SHADOWS.medium,
          },
          circleAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconButton
            icon={icon}
            size={24}
            iconColor={iconColor}
            style={{ margin: 0 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

ExpandableFAB.displayName = "ExpandableFAB";
