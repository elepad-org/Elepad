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
    title: "Memoria",
    emoji: "",
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
    iconColor: COLORS.primary,
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
  focus: {
    id: "focus",
    title: "Focus",
    emoji: "🎯",
    description:
      "Un juego de atención y velocidad mental donde debes identificar el color que indica la palabra, ignorando el color con el que está escrita. ¡Pon a prueba tu concentración!",
    objective:
      "Completa 10 rondas seleccionando correctamente el color que indica la palabra escrita. Tienes 3 vidas, ¡no te equivoques!",
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
                Verás una palabra de color (como <HelpBold>ROJO</HelpBold>,{" "}
                <HelpBold>AZUL</HelpBold>, etc.)
              </>
            ),
          },
          {
            bullet: "2.",
            text: (
              <>
                <HelpBold>Lee la palabra</HelpBold>, NO el color con el que está
                pintada
              </>
            ),
          },
          {
            bullet: "3.",
            text: (
              <>
                <HelpBold>Selecciona el botón</HelpBold> del color que indica la
                palabra
              </>
            ),
          },
          {
            bullet: "4.",
            text: (
              <>
                Por ejemplo: si ves la palabra &quot;ROJO&quot; pintada en azul, debes
                seleccionar <HelpBold>ROJO</HelpBold>
              </>
            ),
          },
        ],
      },
      {
        title: "❤️ Sistema de Vidas",
        emoji: "❤️",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                Comienzas con <HelpBold>3 vidas</HelpBold>
              </>
            ),
          },
          {
            bullet: "•",
            text: "Cada error te cuesta 1 vida",
          },
          {
            bullet: "•",
            text: (
              <>
                Si pierdes las 3 vidas, <HelpBold>la partida termina</HelpBold>
              </>
            ),
          },
        ],
      },
      {
        title: "🎮 Formato del Juego",
        emoji: "🎮",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                Cada partida tiene <HelpBold>10 rondas</HelpBold>
              </>
            ),
          },
          {
            bullet: "•",
            text: "Completa las 10 rondas sin perder tus 3 vidas para ganar",
          },
        ],
      },
      {
        title: "🏆 Sistema de Puntuación",
        emoji: "🏆",
        content: "Tu puntuación depende de:",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Velocidad</HelpBold>: Responder más rápido da más
                puntos
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Precisión</HelpBold>: Menos errores = mejor puntuación
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
            text: "Lee la palabra, no te dejes engañar por el color con el que está pintada",
          },
          {
            bullet: "•",
            text: "Concéntrate y toma tu tiempo, la velocidad viene con la práctica",
          },
          {
            bullet: "•",
            text: "Respira y mantén la calma, es fácil confundirse si vas muy rápido",
          },
        ],
      },
    ],
  },
  sudoku: {
    id: "sudoku",
    title: "Sudoku",
    emoji: "🔢",
    description:
      "El clásico juego de lógica japonés donde debes completar una cuadrícula 9x9 con números del 1 al 9. Perfecto para ejercitar tu pensamiento lógico y concentración.",
    objective:
      "Completa la cuadrícula de 9x9 de modo que cada fila, columna y región de 3x3 contenga todos los números del 1 al 9 sin repetir.",
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
                <HelpBold>Toca una casilla vacía</HelpBold> para seleccionarla
              </>
            ),
          },
          {
            bullet: "2.",
            text: (
              <>
                <HelpBold>Selecciona un número</HelpBold> del teclado numérico
                (1-9)
              </>
            ),
          },
          {
            bullet: "3.",
            text: "El número se colocará si es válido según las reglas del Sudoku",
          },
          {
            bullet: "4.",
            text: "Si cometes un error, perderás una vida",
          },
        ],
      },
      {
        title: "❤️ Sistema de Vidas",
        emoji: "❤️",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                Tienes <HelpBold>3 vidas</HelpBold> para completar el tablero
              </>
            ),
          },
          {
            bullet: "•",
            text: "Cada número incorrecto te cuesta 1 vida",
          },
          {
            bullet: "•",
            text: (
              <>
                Si pierdes las 3 vidas,{" "}
                <HelpBold>el juego termina</HelpBold>
              </>
            ),
          },
        ],
      },
      {
        title: "🎨 Niveles de Dificultad",
        emoji: "🎨",
        content: "",
        items: [
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Fácil</HelpBold>: Más casillas completadas al inicio,
                ideal para principiantes
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Medio</HelpBold>: Menos pistas, requiere más
                razonamiento
              </>
            ),
          },
          {
            bullet: "•",
            text: (
              <>
                <HelpBold>Difícil</HelpBold>: Pocas pistas iniciales, para
                expertos en Sudoku
              </>
            ),
          },
        ],
      },
      {
        title: "📏 Reglas del Sudoku",
        emoji: "📏",
        content: "Un número es válido solo si:",
        items: [
          {
            bullet: "1.",
            text: "No se repite en la misma fila",
          },
          {
            bullet: "2.",
            text: "No se repite en la misma columna",
          },
          {
            bullet: "3.",
            text: "No se repite en el mismo bloque de 3x3",
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
            text: "Busca las casillas que solo puedan tener un número posible",
          },
          {
            bullet: "•",
            text: "Completa primero las filas, columnas o bloques que tienen más números",
          },
          {
            bullet: "•",
            text: "Tómate tu tiempo para pensar antes de colocar un número",
          },
          {
            bullet: "•",
            text: "Si no estás seguro, analiza todas las restricciones antes de decidir",
          },
        ],
      },
    ],
  },
};
