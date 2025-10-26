import { useState, useEffect, useCallback, useRef } from "react";
import { CardState } from "@/components/MemoryGame/MemoryCard";

export interface Card {
  id: number;
  symbol: string;
  state: CardState;
  pairId: number;
}

export interface GameStats {
  moves: number;
  timeElapsed: number;
  isComplete: boolean;
}

const SYMBOLS = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
];

export const useMemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicializar el tablero
  const initializeGame = useCallback(() => {
    // Crear 12 parejas (24 cartas)
    const pairs = SYMBOLS.slice(0, 12);
    const gameCards: Card[] = [];

    pairs.forEach((symbol, index) => {
      gameCards.push({
        id: index * 2,
        symbol,
        state: "hidden" as CardState,
        pairId: index,
      });
      gameCards.push({
        id: index * 2 + 1,
        symbol,
        state: "hidden" as CardState,
        pairId: index,
      });
    });

    // Mezclar las cartas
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setIsComplete(false);
    setIsGameStarted(false);

    // Limpiar el temporizador si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Inicializar al montar
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Temporizador
  useEffect(() => {
    if (isGameStarted && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGameStarted, isComplete]);

  // Voltear una carta
  const flipCard = useCallback(
    (cardId: number) => {
      // Iniciar el juego en el primer movimiento
      if (!isGameStarted) {
        setIsGameStarted(true);
      }

      // No permitir voltear más de 2 cartas
      if (flippedCards.length >= 2) return;

      // No permitir voltear la misma carta dos veces
      if (flippedCards.includes(cardId)) return;

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);

      // Actualizar el estado de la carta
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? { ...card, state: "visible" as CardState }
            : card,
        ),
      );

      // Si se voltearon 2 cartas, verificar si coinciden
      if (newFlippedCards.length === 2) {
        setMoves((prev) => prev + 1);

        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
          // ¡Coinciden!
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstId || card.id === secondId
                  ? { ...card, state: "matched" as CardState }
                  : card,
              ),
            );
            setFlippedCards([]);
          }, 500);
        } else {
          // No coinciden, voltear de nuevo después de 1 segundo
          setTimeout(() => {
            setCards((prevCards) =>
              prevCards.map((card) =>
                card.id === firstId || card.id === secondId
                  ? { ...card, state: "hidden" as CardState }
                  : card,
              ),
            );
            setFlippedCards([]);
          }, 1000);
        }
      }
    },
    [cards, flippedCards, isGameStarted],
  );

  // Verificar si el juego está completo
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.state === "matched")) {
      setIsComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [cards]);

  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  const stats: GameStats = {
    moves,
    timeElapsed,
    isComplete,
  };

  return {
    cards,
    flipCard,
    resetGame,
    stats,
    isProcessing: flippedCards.length >= 2,
  };
};
