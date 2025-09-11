import React from "react";
import { View, Image } from "react-native";
import { Text } from "react-native-paper";
import { STYLES } from "@/styles/base";
import eleEmpthy from "@/assets/images/elepad_mantenimiento.png";

export default function EmptyStateComponent() {
  return (
    <View style={STYLES.center}>
      <Image
        source={eleEmpthy}
        style={{ width: 180, height: 180, marginBottom: 24 }}
      />
      <Text style={STYLES.heading}>No hay recuerdos aún</Text>
      <Text style={STYLES.subheading}>
        Subí tu primer recuerdo tocando el botón Agregar
      </Text>
    </View>
  );
}
