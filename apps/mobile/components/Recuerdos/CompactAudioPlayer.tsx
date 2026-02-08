import { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { useAudioPlayer } from "expo-audio";
import { FONT, SHADOWS } from "@/styles/base";
import Slider from "@react-native-community/slider";

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
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

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

  const toggleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);

    Animated.timing(flipAnimation, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleSliderChange = (value: number) => {
    try {
      player.seekTo(value);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    }),
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["180deg", "360deg"],
        }),
      },
    ],
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    }),
  };

  return (
    <View
      style={{
        width: "96%",
        alignSelf: "center",
        marginBottom: 10,
      }}
    >
      {/* Botón para voltear */}
      <View
        style={{
          alignItems: "center",
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={toggleFlip}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconButton
            icon="swap-horizontal"
            size={28}
            iconColor="#ffffff"
            style={{ margin: 0 }}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{
          minHeight: 245,
          backgroundColor: "#1a1a1a",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Frente del cassette */}
        <Animated.View
          pointerEvents={isFlipped ? "none" : "auto"}
          style={[
            {
              position: "absolute",
              width: "100%",
              top: 0,
              left: 0,
            },
            frontAnimatedStyle,
          ]}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              paddingTop: 16,
              paddingBottom: 16,
              paddingHorizontal: 16,
              borderRadius: 8,
              minHeight: 245,
              borderWidth: 3,
              borderColor: "#1a1a1a",
              ...SHADOWS.medium,
              justifyContent: "space-between",
            }}
          >
            {/* Etiqueta superior */}
            <View
              style={{
                backgroundColor: "#e8e8e8",
                padding: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#c0c0c0",
                justifyContent: "center",
                minHeight: 48,
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

            {/* Diseño del cassette */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "85%",
                  height: 80,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: "#4a4a4a",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 8,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: "#4a4a4a",
                    backgroundColor: "#1a1a1a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#d0d0d0",
                    }}
                  />
                </View>
                <View
                  style={{
                    width: 100,
                    height: 40,
                    backgroundColor: "#1a1a1a",
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: "#4a4a4a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: "80%",
                      height: 4,
                      backgroundColor: "#ff6b35",
                    }}
                  />
                </View>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: "#4a4a4a",
                    backgroundColor: "#1a1a1a",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#d0d0d0",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Reverso del cassette */}
        <Animated.View
          pointerEvents={isFlipped ? "auto" : "none"}
          style={[
            {
              position: "absolute",
              width: "100%",
              top: 0,
              left: 0,
            },
            backAnimatedStyle,
          ]}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              paddingTop: 16,
              paddingBottom: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              minHeight: 245,
              borderWidth: 3,
              borderColor: "#1a1a1a",
              ...SHADOWS.medium,
            }}
          >
            {/* Display LCD con controles */}
            <View
              style={{
                backgroundColor: "#3d3d3d",
                padding: 6,
                borderRadius: 6,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: "#2a2a2a",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
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

                <TouchableOpacity
                  onPress={playAudio}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#ff6b35",
                    justifyContent: "center",
                    alignItems: "center",
                    ...SHADOWS.medium,
                  }}
                >
                  <IconButton
                    icon={isPlaying ? "pause" : "play"}
                    size={24}
                    iconColor="#1a1a1a"
                    style={{ margin: 0 }}
                  />
                </TouchableOpacity>

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

              <View style={{ paddingHorizontal: 4 }}>
                <Slider
                  style={{ width: "100%", height: 15 }}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  value={currentTime}
                  onSlidingComplete={handleSliderChange}
                  minimumTrackTintColor="#ff6b35"
                  maximumTrackTintColor="#2a2a2a"
                  thumbTintColor="#e0e0e0"
                />
              </View>
            </View>

            {/* Información */}
            <View
              style={{
                backgroundColor: "#2a2a2a",
                padding: 10,
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
                    textAlign: "left",
                  }}
                >
                  {date}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
