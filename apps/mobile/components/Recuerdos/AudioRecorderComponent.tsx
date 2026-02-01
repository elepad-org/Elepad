import { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Text, IconButton } from "react-native-paper";
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";
import SaveButton from "../shared/SaveButton";

interface AudioRecorderProps {
  onAudioRecorded: (uri: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function AudioRecorderComponent({
  onAudioRecorded,
  onCancel,
  isUploading = false,
}: AudioRecorderProps) {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  // Crear player con URL dummy inicial
  const player = useAudioPlayer("https://example.com/dummy.m4a", {
    updateInterval: 100,
  });
  const hasValidAudio = !!audioUri;



  // Sincronizar estado del player
  useEffect(() => {
    if (!hasValidAudio) return;

    const interval = setInterval(() => {
      setIsPlaying(player.playing);
      setDuration(player.duration);
    }, 100);

    return () => clearInterval(interval);
  }, [hasValidAudio, player]);

  const requestPermissions = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos insuficientes",
          "Necesitamos permisos para acceder al micrófono."
        );
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      return true;
    } catch {
      console.error("Error al solicitar permisos");
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Limpiar audio anterior si existe
      if (audioUri) {
        setAudioUri(null);
        setIsPlaying(false);
        setDuration(0);
      }

      // Usar preset HIGH_QUALITY directamente sin sobrescribir
      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      await recorder.record();
      console.log("Recording started");
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    try {
      // Guardar URL actual antes de parar, por si el estado se limpia
      const lastUrl = recorderState.url;
      const result = await recorder.stop();
      console.log("Recording stopped, result:", result);

      // El resultado puede ser un string (URI), un objeto con {url}, o void
      let uri: string | null = null;
      if (typeof result === "string") {
        uri = result;
      } else if (result !== undefined && result !== null && typeof result === "object" && "url" in result) {
        uri = (result as { url: string }).url;
      }

      // Fallback para iOS: si no viene en el result, usar el que teníamos antes de parar
      if (!uri && lastUrl) {
        console.log("Using lastUrl fallback:", lastUrl);
        uri = lastUrl;
      }

      console.log("Extracted URI:", uri);
      if (uri) {
        setAudioUri(uri);
        // Usar replace para cambiar la fuente del player existente
        try {
          player.replace(uri);
          console.log("Player source replaced with:", uri);
          // Esperar un poco para que cargue
          setTimeout(() => {
            console.log("After replace - duration:", player.duration);
          }, 500);
        } catch (error) {
          console.error("Error replacing player source:", error);
        }
      }
    } catch (error) {
      console.error("Error al detener grabación:", error);
    }
  };

  const playSound = () => {
    if (!hasValidAudio) return;
    console.log("Play/Pause audio, URL:", audioUri);
    console.log("Player duration:", player.duration);
    console.log("Player currentTime:", player.currentTime);

    try {
      if (player.playing) {
        console.log("Pausing...");
        player.pause();
        setIsPlaying(false);
      } else {
        console.log("Playing...");
        // Si el audio terminó, volver al inicio
        if (
          player.currentTime >= player.duration - 0.1 &&
          player.duration > 0
        ) {
          player.seekTo(0);
        }
        player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error al reproducir audio:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    // Redondear a 2 decimales
    const rounded = Math.round(seconds * 100) / 100;
    const mins = Math.floor(rounded / 60);
    const secs = Math.floor(rounded % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
        borderRadius: 20,
      }}
    >
      <Text style={STYLES.heading}>Grabar audio</Text>

      <Text style={{ ...STYLES.subheading, marginBottom: 8 }}>
        {recorderState.isRecording
          ? `Grabando... ${formatTime(
              Math.floor(recorderState.durationMillis / 1000)
            )}`
          : audioUri
            ? `Audio grabado (${formatTime(duration)}) - ${isPlaying ? "Reproduciendo..." : "Presiona play para escuchar"
            }`
            : "Presiona el botón para comenzar a grabar"}
      </Text>

      {/* Visualización de onda cuando está grabando */}
      {recorderState.isRecording && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 60,
            gap: 3,
            marginBottom: 12,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 12,
            paddingHorizontal: 20,
          }}
        >
          {[...Array(20)].map((_, i) => {
            const baseHeight = 10 + (Math.sin(Date.now() / 100 + i) * 20);
            const height = Math.max(8, Math.abs(baseHeight));
            return (
              <View
                key={i}
                style={{
                  width: 4,
                  height: height,
                  backgroundColor: COLORS.primary,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </View>
      )}

      {/* Visualización de waveform cuando el audio está grabado */}
      {audioUri && !recorderState.isRecording && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 60,
            gap: 2,
            marginBottom: 12,
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 12,
            paddingHorizontal: 20,
          }}
        >
          {[...Array(30)].map((_, i) => {
            // Generar alturas variadas para simular waveform
            const heights = [15, 30, 25, 40, 35, 20, 45, 30, 25, 35, 40, 30, 20, 35, 40, 25, 30, 45, 35, 20, 40, 30, 25, 35, 30, 20, 40, 35, 25, 30];
            const height = heights[i % heights.length];
            const progress = isPlaying && duration > 0 ? (player.currentTime / duration) * 30 : 0;
            const isPlayed = i < progress;
            return (
              <View
                key={i}
                style={{
                  width: 3,
                  height: height,
                  backgroundColor: isPlayed ? COLORS.primary : "#d0d0d0",
                  borderRadius: 2,
                }}
              />
            );
          })}
        </View>
      )}

      <View style={{ alignItems: "center", marginVertical: 12 }}>
        {audioUri && !recorderState.isRecording ? (
          <TouchableOpacity
            onPress={playSound}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#e0e0e0",
            }}
          >
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              size={50}
              iconColor={COLORS.primary}
              style={{ margin: 0 }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: recorderState.isRecording
                ? COLORS.error
                : "#e0e0e0",
            }}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
          >
            <View
              style={{
                width: recorderState.isRecording ? 30 : 50,
                height: recorderState.isRecording ? 30 : 50,
                borderRadius: recorderState.isRecording ? 5 : 25,
                backgroundColor: recorderState.isRecording
                  ? COLORS.error
                  : COLORS.primary,
              }}
            />
          </TouchableOpacity>
        )}
      </View>

      {audioUri && !recorderState.isRecording && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ width: 120 }}>
            <CancelButton onPress={onCancel} disabled={isUploading} />
          </View>
          <View style={{ width: 120 }}>
            <SaveButton
              onPress={() => audioUri && onAudioRecorded(audioUri)}
              text={isUploading ? "Subiendo..." : "Guardar"}
              disabled={isUploading}
              loading={isUploading}
            />
          </View>
        </View>
      )}

      {!audioUri && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ width: 120 }}>
            <CancelButton onPress={onCancel} disabled={isUploading} />
          </View>
        </View>
      )}
    </View>
  );
}
