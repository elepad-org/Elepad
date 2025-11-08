import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { COLORS } from "@/styles/base";
import { TileType, Rotation } from "@/hooks/useNetGame";
import Svg, { Path, Circle } from "react-native-svg";

interface NetTileProps {
  id: number;
  type: TileType;
  rotation: Rotation;
  isLocked: boolean;
  isConnected: boolean;
  onRotate: (direction: "clockwise" | "counterclockwise") => void;
  onToggleLock: () => void;
  disabled: boolean;
}

export const NetTile: React.FC<NetTileProps> = ({
  type,
  rotation,
  isLocked,
  isConnected,
  onRotate,
  onToggleLock,
  disabled,
}) => {
  // Renderizar las conexiones del tile usando SVG
  const renderConnections = () => {
    if (type === "empty") return null;

    const size = 60;
    const center = size / 2;
    const lineWidth = 6;
    const connectionColor = isConnected ? COLORS.success : COLORS.textSecondary;

    return (
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        {/* Centro del tile (siempre presente excepto en empty) */}
        <Circle cx={center} cy={center} r={lineWidth} fill={connectionColor} />

        {/* Endpoint: una línea */}
        {type === "endpoint" && (
          <Path
            d={`M ${center} ${center} L ${center} 0`}
            stroke={connectionColor}
            strokeWidth={lineWidth}
            strokeLinecap="round"
          />
        )}

        {/* Straight: línea vertical */}
        {type === "straight" && (
          <Path
            d={`M ${center} 0 L ${center} ${size}`}
            stroke={connectionColor}
            strokeWidth={lineWidth}
            strokeLinecap="round"
          />
        )}

        {/* Corner: curva */}
        {type === "corner" && (
          <>
            <Path
              d={`M ${center} ${center} L ${center} 0`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
            <Path
              d={`M ${center} ${center} L ${size} ${center}`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
          </>
        )}

        {/* T-junction: tres líneas */}
        {type === "t-junction" && (
          <>
            <Path
              d={`M ${center} 0 L ${center} ${size}`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
            <Path
              d={`M ${center} ${center} L ${size} ${center}`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Cross: cuatro líneas */}
        {type === "cross" && (
          <>
            <Path
              d={`M ${center} 0 L ${center} ${size}`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
            <Path
              d={`M 0 ${center} L ${size} ${center}`}
              stroke={connectionColor}
              strokeWidth={lineWidth}
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    );
  };

  return (
    <View style={styles.tileContainer}>
      <TouchableOpacity
        onPress={() => onRotate("clockwise")}
        onLongPress={onToggleLock}
        disabled={disabled || isLocked || type === "empty"}
        activeOpacity={0.7}
        style={[
          styles.tile,
          isConnected && styles.tileConnected,
          isLocked && styles.tileLocked,
          type === "empty" && styles.tileEmpty,
        ]}
      >
        {renderConnections()}

        {/* Indicador de bloqueo */}
        {isLocked && (
          <View style={styles.lockIndicator}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    width: "18%",
    aspectRatio: 1,
    margin: "1%",
  },
  tile: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tileConnected: {
    backgroundColor: "#E8F5E9", // Verde muy claro
    borderColor: COLORS.success,
    borderWidth: 3,
  },
  tileLocked: {
    borderColor: "#FFA726", // Naranja/amarillo
    borderWidth: 3,
    backgroundColor: "#FFF8E1", // Amarillo muy claro
  },
  tileEmpty: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: "transparent",
    elevation: 0,
  },
  lockIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    fontSize: 12,
  },
});
