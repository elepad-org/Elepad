import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

// Widget básico de ejemplo para Elepad
export function TaskWidget() {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="📋 Elepad"
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#333333",
          marginBottom: 8,
        }}
      />
      <TextWidget
        text="Actividades pendientes: 3"
        style={{
          fontSize: 14,
          color: "#666666",
        }}
      />
    </FlexWidget>
  );
}
