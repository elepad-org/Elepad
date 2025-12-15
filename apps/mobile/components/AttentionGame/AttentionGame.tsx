import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { AttentionGameCore, COLORS_MAP, ColorName } from "./game";
import { Button, Portal, Dialog, Paragraph } from "react-native-paper";
import { router } from "expo-router";

type Props = {
  rounds?: number; // cantidad de rondas a jugar (para test por ahora), se podría cambiar por vidas
  onFinish?: (score: { correct: number; total: number }) => void;
};

export default function AttentionGame({ rounds = 10, onFinish }: Props) {
  const core = useMemo(() => new AttentionGameCore(), []);
  const [tick, setTick] = useState(0); // forzar re-render cuando cambia core
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [lives, setLives] = useState(3);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    // iniciar primera ronda
    core.startRound();
    setTick((t) => t + 1);
  }, [core]);

  const prompt = core.currentPrompt;

  const restartGame = () => {
    core.reset();
    core.startRound();
    setScore({ correct: 0, total: 0 });
    setLives(3);
    setLastResult(null);
    setModalVisible(false);
    setTick((t) => t + 1);
  };

  const handleSelection = (selection: ColorName) => {
    if (!prompt || modalVisible) return;
    const correct = core.handleSelection(selection);
    setLastResult(correct);
    console.log(correct ? "Acierto" : "Error", {
      selection,
      correct,
      word: prompt.word,
    });

    const newScore = {
      correct: score.correct + (correct ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);
    setTick((t) => t + 1);

    // manejar vidas y finalizar o continuar
    if (!correct) {
      setLives((prev) => {
        const remaining = prev - 1;
        // si se quedó sin vidas, mostrar modal de pérdida
        if (remaining <= 0) {
          setTimeout(() => {
            setModalTitle("Perdiste");
            setModalMessage(
              `Te quedaste sin vidas.\n Tu puntaje fue de: ${newScore.correct} aciertos.`,
            );
            setModalVisible(true);
            onFinish?.(newScore);
          }, 350);
        } else {
          setTimeout(() => {
            core.next();
            core.startRound();
            setLastResult(null);
            setTick((t) => t + 1);
          }, 350);
        }
        return remaining;
      });
    } else {
      // acierto: comprobar condición de victoria por rondas
      if (newScore.total >= rounds) {
        setTimeout(() => {
          setModalTitle("¡Ganaste!");
          setModalMessage(
            `Acertaste ${newScore.correct}/${newScore.total} rondas.`,
          );
          setModalVisible(true);
          onFinish?.(newScore);
        }, 350);
      } else {
        setTimeout(() => {
          core.next();
          core.startRound();
          setLastResult(null);
          setTick((t) => t + 1);
        }, 350);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.promptBox,
          {
            backgroundColor: "rgba(0,0,0,0.05)",
            borderWidth: lastResult === null ? 0 : 4,
            borderColor:
              lastResult === null
                ? "transparent"
                : lastResult
                  ? "#4CAF50"
                  : "#E53935",
          },
        ]}
      >
        {prompt ? (
          <Text style={[styles.promptText, { color: prompt.fillColor }]}>
            {prompt.word}
          </Text>
        ) : (
          <Text style={styles.promptText}>Pulsa iniciar</Text>
        )}
      </View>

      <View style={styles.grid}>
        {Object.keys(COLORS_MAP).map((k) => {
          const key = k as ColorName;
          const bg = COLORS_MAP[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.colorButton, { backgroundColor: bg }]}
              onPress={() => handleSelection(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.colorLabel,
                  { color: bg === "#FFFFFF" ? "#000" : "#fff" },
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.controls}>
        <Button mode="outlined" onPress={restartGame}>
          Reiniciar
        </Button>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text>
          Rondas: {score.total} / {rounds}
        </Text>
        <Text>Aciertos: {score.correct}</Text>
        <Text>Vidas: {lives}</Text>
      </View>

      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            router.back();
          }}
        >
          <Dialog.Title>{modalTitle}</Dialog.Title>
          <Dialog.Content>
            <Text>{modalMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                restartGame();
              }}
            >
              Jugar de nuevo
            </Button>
            <Button
              onPress={() => {
                setModalVisible(false);
                router.back();
              }}
            >
              Cerrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
