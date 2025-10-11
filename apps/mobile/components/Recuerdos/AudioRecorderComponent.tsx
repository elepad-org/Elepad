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

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri);
  const recorderState = useAudioRecorderState(recorder);

  // Watch for recording completion and set audioUri
  useEffect(() => {
    if (recorderState.url && !audioUri) {
      setAudioUri(recorderState.url);
    }
  }, [recorderState.url, audioUri]);

  // Watch for audio playback completion
  useEffect(() => {
    if (player && !player.playing && isPlaying) {
      // Audio has stopped playing, reset the playing state
      setIsPlaying(false);
    }
  }, [player?.playing, isPlaying]);

  const requestPermissions = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos insuficientes",
          "Necesitamos permisos para acceder al micrófono.",
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
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
    } catch (error) {
      console.error("Error al detener grabación:", error);
    }
  };

  const playSound = () => {
    if (!audioUri || !player) return;
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error al reproducir audio:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        {recorderState.isRecording
          ? `Grabando... ${formatTime(Math.floor(recorderState.durationMillis / 1000))}`
          : audioUri
            ? "Audio grabado - Presiona reproducir para escuchar"
            : "Presiona el botón para comenzar a grabar"}
      </Text>

      <View style={{ alignItems: "center", marginVertical: 20 }}>
        {audioUri && !recorderState.isRecording ? (
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            size={50}
            iconColor={COLORS.primary}
            onPress={playSound}
            style={{ backgroundColor: COLORS.accent }}
          />
        ) : (
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.accent,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: recorderState.isRecording
                ? COLORS.error
                : COLORS.primary,
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
          <CancelButton onPress={onCancel} disabled={isUploading} />
          <CancelButton
            onPress={() => audioUri && onAudioRecorded(audioUri)}
            text={isUploading ? "Subiendo..." : "Guardar"}
            disabled={isUploading}
          />
        </View>
      )}

      {!audioUri && <CancelButton onPress={onCancel} disabled={isUploading} />}
    </View>
  );
}
