import React from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import { STYLES } from "@/styles/base";

type Props = {
  attempt: any;
};

export default function AttemptCard({ attempt }: Props) {
  const started = attempt?.startedAt
    ? new Date(attempt.startedAt).toLocaleString()
    : "-";
  const durationFormatted = (() => {
    if (!attempt?.durationMs) return "-";
    const totalSeconds = Math.floor(attempt.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} minuto/s - ${seconds} segundo/s`; // TODO: Cambiar por un mejor formato
  })();
  const score = attempt?.score ?? "-";
  const finished = attempt?.success ? "Sí" : "No"; // Agregar algun estilo diferente si se tuvo exito?

  return (
    <Card style={[STYLES.titleCard, { marginBottom: 5 }]}>
      <Card.Content>
        <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
          {started}
        </Text>
        <View style={{ height: 6 }} />
        <Text>Duración: {durationFormatted}</Text>
        <Text>Puntaje: {score}</Text>
        <Text>Finalizada: {finished}</Text>
      </Card.Content>
    </Card>
  );
}
