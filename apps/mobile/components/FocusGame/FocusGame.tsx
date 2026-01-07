import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { AttentionGameCore, COLORS_MAP, ColorName } from "./game";
import { Button, Portal, Dialog } from "react-native-paper";
import { router } from "expo-router";
import { COLORS } from "@/styles/base";

type Props = {
  rounds?: number; // cantidad de rondas a jugar (para test por ahora), se podría cambiar por vidas
  onFinish?: (score: { correct: number; rounds: number }) => void;
  onRestart?: (score: { correct: number; rounds: number }) => void;
};

export default function AttentionGame({
  rounds = 10,
  onFinish,
  onRestart,
}: Props) {
  const core = useMemo(() => new AttentionGameCore(), []);
  const [tick, setTick] = useState(0); // forzar re-render cuando cambia core
  const [score, setScore] = useState({ correct: 0, rounds: rounds });
  const [lives, setLives] = useState(3);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    // iniciar primera ronda
    core.startRound();
    setTick((t) => t + 1);
  }, [core]);

  const prompt = core.currentPrompt;

  const restartGame = () => {
    // notify parent before resetting so it can register attempt finish
    try {
      onRestart?.(score);
    } catch (e) {
      // ignore errors from parent
    }
    core.reset();
    core.startRound();
    setScore({ ...score, correct: 0 });
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

    setScore({ ...score, correct: score.correct + (correct ? 1 : 0) });
    setCurrentRound((prev) => prev + 1);
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
              `Te quedaste sin vidas.\n Tu puntaje fue de: ${score.correct} aciertos.`,
            );
            setModalVisible(true);
            onFinish?.(score);
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
      if (currentRound === rounds) {
        setTimeout(() => {
          setModalTitle("¡Ganaste!");
          setModalMessage(`Acertaste ${score.correct}/${score.rounds} rondas.`);
          setModalVisible(true);
          onFinish?.(score);
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
      {/* Estadísticas superiores, mismas líneas visuales que otros juegos */}
      <View style={styles.statsCard}>
        <View style={styles.statsContent}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>🎯 Ronda</Text>
            <Text style={styles.statValue}>
              {currentRound} / {rounds}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>✅ Aciertos</Text>
            <Text style={styles.statValue}>{score.correct}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>❤️ Vidas</Text>
            <Text style={styles.statValue}>{lives}</Text>
          </View>
        </View>
      </View>
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
        <Button mode="contained" onPress={restartGame} icon="refresh" style={styles.button}>
          Reiniciar
        </Button>
        <Button mode="outlined" onPress={() => router.back()} icon="exit-to-app" style={styles.button}>
          Abandonar
        </Button>
      </View>

      {/* Se elimina el bloque de texto simple de estadísticas para evitar duplicar UI */}

      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            router.back();
          }}
          style={{
            backgroundColor: COLORS.background,
            width: "90%",
            alignSelf: "center",
            borderRadius: 16,
            paddingVertical: 14,
          }}
        >
          <Dialog.Title>{modalTitle}</Dialog.Title>
          <Dialog.Content>
            <Text>{modalMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 12, paddingHorizontal: 20 }}>
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
