import { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { useAudioPlayer } from "expo-audio";
import { FONT, SHADOWS, COLORS } from "@/styles/base";
import Slider from "@react-native-community/slider";
import HighlightedMentionText from "./HighlightedMentionText";

import cassetteSound from "@/assets/sounds/cassette-play-sound-effect.mp3";

interface CompactAudioPlayerProps {
  audioUri: string;
  title?: string;
  caption?: string;
  date?: string;
  familyMembers?: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
}

export default function CompactAudioPlayer({
  audioUri,
  title,
  caption,
  date,
  familyMembers = [],
}: CompactAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const player = useAudioPlayer(audioUri, {
    updateInterval: 100,
  });



  const [isPlayingEffect, setIsPlayingEffect] = useState(false);
  const effectPlayer = useAudioPlayer(cassetteSound);

  const ignoreEffectCompletion = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Monitor effect player
      if (isPlayingEffect) {
        if (ignoreEffectCompletion.current) {
          ignoreEffectCompletion.current = false;
          return;
        }

        if (
          effectPlayer.currentTime >= effectPlayer.duration - 0.1 &&
          effectPlayer.duration > 0
        ) {
          setIsPlayingEffect(false);
          effectPlayer.seekTo(0);
          effectPlayer.pause();
          player.play();
        }
      }

      setIsPlaying(player.playing || isPlayingEffect);
      setDuration(player.duration);
      setCurrentTime(player.currentTime);
    }, 100);

    return () => clearInterval(interval);
  }, [player, effectPlayer, isPlayingEffect]);

  useEffect(() => {
    return () => {
      try {
        if (player.playing) {
          player.pause();
        }
        if (effectPlayer.playing) {
          effectPlayer.pause();
        }
      } catch {
        // ignore
      }
    };
  }, [player, effectPlayer]);

  const playAudio = () => {
    try {
      if (isPlayingEffect) {
        setIsPlayingEffect(false);
        effectPlayer.pause();
        effectPlayer.seekTo(0);
        return;
      }

      if (player.playing) {
        player.pause();
      } else {
        // Si está al final, volver al inicio
        if (
          player.currentTime >= player.duration - 0.1 &&
          player.duration > 0
        ) {
          player.pause();
          player.seekTo(0);
          // Play effect first
          setIsPlayingEffect(true);
          ignoreEffectCompletion.current = true;
          effectPlayer.seekTo(0);
          effectPlayer.play();
        } else if (player.currentTime === 0) {
          // Si está al inicio, reproducir efecto
          player.pause();
          setIsPlayingEffect(true);
          ignoreEffectCompletion.current = true;
          effectPlayer.seekTo(0);
          effectPlayer.play();
        } else {
          // Si está pausado en el medio, continuar sin efecto
          player.play();
        }
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

  const handleFrontPlay = () => {
    // Girar al reverso
    if (!isFlipped) {
      setIsFlipped(true);
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
    // Reproducir audio
    playAudio();
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
        width: "100%",
        paddingHorizontal: 20,
        alignSelf: "center",
        marginBottom: 10,
      }}
    >
      {/* Botones de control: Flip y Play */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 8,
          gap: 12,
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
        <TouchableOpacity
          onPress={handleFrontPlay}
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
            icon={isPlaying ? "pause" : "play"}
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


            {/* Cintas centradas en el espacio restante */}
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
                      backgroundColor: COLORS.primary,
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
                    color: COLORS.primary,
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
                    backgroundColor: COLORS.primary,
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
                    color: COLORS.primary,
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
                  minimumTrackTintColor={COLORS.primary}
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
                <HighlightedMentionText
                  text={caption}
                  familyMembers={familyMembers}
                  numberOfLines={2}
                  style={{
                    fontSize: 12,
                    color: "#d0d0d0",
                    fontFamily: FONT.regular,
                    marginBottom: 8,
                  }}
                />
              )}
              {date && (
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.primary,
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
