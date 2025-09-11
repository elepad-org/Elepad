import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Button, Text, IconButton } from "react-native-paper";
import { Audio } from "expo-av";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

interface AudioRecorderProps {
  onAudioRecorded: (uri: string) => void;
  onCancel: () => void;
}

export default function AudioRecorderComponent({
  onAudioRecorded,
  onCancel,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (sound) sound.unloadAsync();
    };
  }, [isRecording, sound]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permisos insuficientes",
          "Necesitamos permisos para acceder al micrófono.",
        );
        return false;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      return true;
    } catch (error) {
      console.error("Error al solicitar permisos:", error);
      return false;
    }
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setRecordingDuration(0);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      if (uri) setAudioUri(uri);
    } catch (error) {
      console.error("Error al detener grabación:", error);
    }
  };

  const playSound = async () => {
    if (!audioUri) return;
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: audioUri,
      });
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
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
      }}
    >
      <Text style={STYLES.heading}>Grabar audio</Text>

      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        {isRecording
          ? `Grabando... ${formatTime(recordingDuration)}`
          : audioUri
            ? "Audio grabado - Presiona reproducir para escuchar:"
            : "Presiona el botón para comenzar a grabar:"}
      </Text>

      <View style={{ alignItems: "center", marginVertical: 20 }}>
        {audioUri && !isRecording ? (
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            size={50}
            iconColor={COLORS.primary}
            onPress={isPlaying ? () => sound?.pauseAsync() : playSound}
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
              borderColor: isRecording ? COLORS.error : COLORS.primary,
            }}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View
              style={{
                width: isRecording ? 30 : 50,
                height: isRecording ? 30 : 50,
                borderRadius: isRecording ? 5 : 25,
                backgroundColor: isRecording ? COLORS.error : COLORS.primary,
              }}
            />
          </TouchableOpacity>
        )}
      </View>

      {audioUri && !isRecording && (
        <Button
          mode="contained"
          onPress={() => audioUri && onAudioRecorded(audioUri)}
          style={{ ...STYLES.buttonPrimary, marginBottom: 20 }}
        >
          Guardar grabación
        </Button>
      )}

      <CancelButton onPress={onCancel} />
    </View>
  );
}
