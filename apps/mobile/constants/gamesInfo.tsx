import React from "react";
import { Text } from "react-native";
import { COLORS } from "@/styles/base";

export type GameInfoSection = {
  title: string;
  emoji: string;
  content: string | React.ReactNode;
  items?: Array<{
    bullet: string;
    text: string | React.ReactNode;
  }>;
};

export type GameInfo = {
  id: string;
  title: string;
  emoji: string;
  iconName?: string;
  iconColor?: string;
  description: string;
  objective: string;
  sections: GameInfoSection[];
};

const HelpBold: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color,
}) => (
  <Text style={{ fontWeight: "bold", color: color || COLORS.primary }}>
    {children}
  </Text>
);

export const GAMES_INFO: Record<string, GameInfo> = {
  memory: {
    id: "memory",
    title: "Juego de Memoria",
    emoji: "🧠",
    description:
      "Un clásico juego de memoria donde debes encontrar todas las parejas de cartas iguales. Perfecto para entrenar tu memoria visual y concentración.",
    objective:
      "Encuentra todas las parejas de cartas idénticas en el menor tiempo y con la menor cantidad de movimientos posible.",
    sections: [
      {
        title: "🕹️ Cómo Jugar",
        emoji: "🕹️",
        content: "",
        items: [
          {
            bullet: "1.",
            text: (
              <>
                <HelpBold>Toca una carta</HelpBold> para darle la vuelta y ver
                su símbolo
              </>
            ),
          },
          {
            bullet: "2.",
            text: (
              <>
                <HelpBold>Toca otra carta</HelpBold> para intentar encontrar su
                pareja
              </>
            ),
          },
          {
            bullet: "3.",
            text: (
              <>
                Si las cartas <HelpBold>coinciden</HelpBold>, se quedarán boca
                arriba
              </>
            ),
          },
          {
            bullet: "4.",
            text: "Si no coinciden, se voltearán automáticamente después de un momento",
          },
        ],
      },
      {
        title: "🎨 Modos de Juego",
        emoji: "🎨",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>4x4 (Fácil)</HelpBold>: 16 cartas, 8 parejas -
                perfecto para principiantes
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>4x6 (Difícil)</HelpBold>: 24 cartas, 12 parejas - para
                un desafío mayor
              </>
            ),
          },
        ],
      },
      {
        title: "🏆 Sistema de Puntuación",
        emoji: "🏆",
        content: "Tu puntuación se calcula basándose en:",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Tiempo</HelpBold>: Menos tiempo = más puntos
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Movimientos</HelpBold>: Menos movimientos = más puntos
              </>
            ),
          },
        ],
      },
      {
        title: "💡 Consejos",
        emoji: "💡",
        content: "",
        items: [
          {
            bullet: "•",
            text: "Intenta memorizar la posición de las cartas que ya volteaste",
          },
          {
            bullet: "•",
            text: "Toma tu tiempo para recordar antes de hacer tu próximo movimiento",
          },
          {
            bullet: "•",
            text: "Completa el juego para desbloquear logros especiales",
          },
        ],
      },
    ],
  },
  net: {
    id: "net",
    title: "NET",
    emoji: "🌐",
    iconName: "lan",
    iconColor: "#2196F3",
    description:
      "Un desafiante juego de lógica donde debes conectar toda la red girando las casillas. Perfecto para mejorar tu pensamiento espacial y habilidades de resolución de problemas.",
    objective:
      "Conecta todas las casillas de la red girándolas hasta formar una red completamente conectada sin circuitos cerrados (loops).",
    sections: [
      {
        title: "🕹️ Controles",
        emoji: "🕹️",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Toca una casilla</HelpBold> para rotarla 90° en
                sentido horario
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Mantén presionado</HelpBold> para bloquear/desbloquear
                una casilla
              </>
            ),
          },
        ],
      },
      {
        title: "🎨 Colores",
        emoji: "🎨",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold color={COLORS.success}>Verde claro</HelpBold>: Casilla
                conectada a la red principal
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Blanco</HelpBold>: Casilla no conectada aún
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold color="#FFA726">Amarillo</HelpBold>: Casilla bloqueada
                (no se puede rotar)
              </>
            ),
          },
        ],
      },
      {
        title: "✅ Condiciones de Victoria",
        emoji: "✅",
        content: "",
        items: [
          {
            bullet: "1.",
            text: "Todas las casillas deben estar conectadas (verdes)",
          },
          {
            bullet: "2.",
            text: "NO debe haber circuitos cerrados (loops)",
          },
        ],
      },
      {
        title: "⚠️ ¿Qué es un Loop?",
        emoji: "⚠️",
        content:
          "Un loop es un camino que vuelve sobre sí mismo formando un circuito cerrado. Por ejemplo, si puedes seguir las conexiones y volver al punto de inicio sin retroceder, ¡hay un loop!\n\nLa red debe ser un árbol (sin ciclos), donde hay exactamente un camino entre cualquier par de casillas.",
        items: [],
      },
      {
        title: "💡 Consejos",
        emoji: "💡",
        content: "",
        items: [
          {
            bullet: "•",
            text: "Empieza desde el centro y expándete hacia afuera",
          },
          {
            bullet: "•",
            text: "Bloquea las casillas que estés seguro que están correctas",
          },
          {
            bullet: "•",
            text: "Si todas están verdes pero no ganas, busca y elimina loops",
          },
        ],
      },
    ],
  },
};
