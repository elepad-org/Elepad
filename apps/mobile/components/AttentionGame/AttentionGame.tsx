import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { AttentionGameCore, COLORS_MAP, ColorName } from "./game";
import { Button } from "react-native-paper";

type Props = {
  rounds?: number; // cantidad de rondas a jugar (para test por ahora), se podría cambiar por vidas
  onFinish?: (score: { correct: number; total: number }) => void;
};

export default function AttentionGame({ rounds = 10, onFinish }: Props) {
  const core = useMemo(() => new AttentionGameCore(), []);
  const [tick, setTick] = useState(0); // forzar re-render cuando cambia core
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    // iniciar primera ronda
    core.startRound();
    setTick((t) => t + 1);
  }, [core]);

  const prompt = core.currentPrompt;

  const handleSelection = (selection: ColorName) => {
    if (!prompt) return;
    const correct = core.handleSelection(selection);
    console.log(correct ? "Acierto" : "Error", {
      selection,
      correct,
      word: prompt.word,
    });
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    setTick((t) => t + 1);

    // mostrar resultado antes de seguir
    // TODO: mostrar con un status o alguna forma más visual
    setTimeout(() => {
      if (score.total + 1 >= rounds) {
        onFinish?.({
          correct: score.correct + (correct ? 1 : 0),
          total: score.total + 1,
        });
        core.reset();
      } else {
        core.next();
        core.startRound();
      }
      setTick((t) => t + 1);
    }, 350);
  };

  const handleNext = () => {
    core.startRound();
    setTick((t) => t + 1);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.promptBox, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
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
        <Button
          mode="outlined"
          onPress={() => {
            core.reset();
            setScore({ correct: 0, total: 0 });
            setTick((t) => t + 1);
          }}
        >
          Reiniciar
        </Button>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text>
          Rondas: {score.total} / {rounds}
        </Text>
        <Text>Aciertos: {score.correct}</Text>
      </View>
    </View>
  );
}
