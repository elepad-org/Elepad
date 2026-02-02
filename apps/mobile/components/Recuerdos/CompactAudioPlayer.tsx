import { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { useAudioPlayer } from "expo-audio";
import { FONT, SHADOWS } from "@/styles/base";

interface CompactAudioPlayerProps {
  audioUri: string;
  title?: string;
  caption?: string;
  date?: string;
  waveformData?: number[];
}

export default function CompactAudioPlayer({
  audioUri,
  title,
  caption,
  date,
  waveformData = [],
}: CompactAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const player = useAudioPlayer(audioUri, {
    updateInterval: 100,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(player.playing);
      setDuration(player.duration);
      setCurrentTime(player.currentTime);
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    return () => {
      try {
        if (player.playing) {
          player.pause();
        }
      } catch {
        // ignore
      }
    };
  }, [player]);

  const playAudio = () => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        if (player.currentTime >= player.duration - 0.1 && player.duration > 0) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View
      style={{
        backgroundColor: "#1a1a1a",
        padding: 20,
        borderRadius: 10,
        minHeight: 280,
        borderWidth: 3,
        borderColor: "#0a0a0a",
        ...SHADOWS.medium,
        marginBottom: 30,
        width: "96%",
        alignSelf: "center",
      }}
    >
      {/* Etiqueta superior */}
      <View
        style={{
          backgroundColor: "#e8e8e8",
          padding: 12,
          borderRadius: 4,
          marginBottom: 15,
          borderWidth: 1,
          borderColor: "#c0c0c0",
          ...SHADOWS.light,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: "#666",
            textAlign: "center",
            fontFamily: FONT.regular,
            marginBottom: 4,
          }}
        >
          ÚLTIMO RECUERDO
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 14,
            color: "#1a1a1a",
            textAlign: "center",
            fontFamily: FONT.regular,
            fontWeight: "600",
          }}
        >
          {title || "Nota de voz"}
        </Text>
      </View>

      {/* Display LCD - Con waveform integrado */}
      <View
        style={{
          backgroundColor: "#3d3d3d",
          padding: 10,
          borderRadius: 6,
          marginBottom: 15,
          borderWidth: 2,
          borderColor: "#2a2a2a",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#ff6b35",
              fontSize: 16,
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            {formatTime(currentTime)}
          </Text>
          
          {/* Waveform en el centro */}
          {waveformData.length > 0 && (
            <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
              {waveformData.map((height, i) => {
                const progress = isPlaying && duration > 0 ? (currentTime / duration) * waveformData.length : 0;
                const isPlayed = i < progress;
                return (
                  <View
                    key={i}
                    style={{
                      width: 2,
                      height: Math.max(6, height * 0.4),
                      backgroundColor: isPlayed ? "#ff6b35" : "#666",
                      borderRadius: 1,
                    }}
                  />
                );
              })}
            </View>
          )}
          
          <Text
            style={{
              color: "#ff6b35",
              fontSize: 16,
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Botón de play/pause */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <TouchableOpacity
          onPress={playAudio}
          style={{
            width: 60,
            height: 60,
            backgroundColor: "#ff6b35",
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 3,
            borderColor: "#d85a2a",
            ...SHADOWS.medium,
          }}
        >
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            size={30}
            iconColor="#1a1a1a"
            style={{ margin: 0 }}
          />
        </TouchableOpacity>
      </View>

      {/* Información */}
      <View
        style={{
          backgroundColor: "#2a2a2a",
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#3a3a3a",
        }}
      >
        {caption && (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              color: "#d0d0d0",
              fontFamily: FONT.regular,
              marginBottom: 8,
            }}
          >
            {caption}
          </Text>
        )}
        {date && (
          <Text
            style={{
              fontSize: 11,
              color: "#999",
              fontFamily: FONT.regular,
              textAlign: "center",
            }}
          >
            {date}
          </Text>
        )}
      </View>
    </View>
  );
}
