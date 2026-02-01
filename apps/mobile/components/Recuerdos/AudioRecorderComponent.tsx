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
        backgroundColor: "#1a1a1a",
        padding: 20,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#0a0a0a",
      }}
    >
      <View
        style={{
          backgroundColor: "#e8e8e8",
          padding: 10,
          borderRadius: 4,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#c0c0c0",
        }}
      >
        <Text
          style={{
            ...STYLES.heading,
            color: "#1a1a1a",
            textAlign: "center",
          }}
        >
          Grabar audio
        </Text>
      </View>

      {/* Display LCD estilo vintage */}
      <View
        style={{
          backgroundColor: "#3d3d3d",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          borderWidth: 2,
          borderColor: "#2a2a2a",
        }}
      >
        <Text
          style={{
            color: "#ff6b35",
            fontSize: 14,
            fontFamily: "monospace",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {recorderState.isRecording
            ? `⬤ REC ${formatTime(
                Math.floor(recorderState.durationMillis / 1000)
              )}`
            : audioUri
              ? `${isPlaying ? "▶ PLAY" : "⏸ PAUSE"} ${formatTime(duration)}`
              : "⏹ READY"}
        </Text>
      </View>

      <View style={{ alignItems: "center", marginVertical: 20 }}>
        {audioUri && !recorderState.isRecording ? (
          <TouchableOpacity
            onPress={playSound}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#ff6b35",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 3,
              borderColor: "#d85a2a",
            }}
          >
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              size={40}
              iconColor="#1a1a1a"
              style={{ margin: 0 }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#4a4a4a",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 3,
              borderColor: recorderState.isRecording ? "#ff6b35" : "#2a2a2a",
            }}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
          >
            <View
              style={{
                width: recorderState.isRecording ? 30 : 50,
                height: recorderState.isRecording ? 30 : 50,
                borderRadius: recorderState.isRecording ? 5 : 25,
                backgroundColor: recorderState.isRecording
                  ? "#ff6b35"
                  : "#d0d0d0",
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
