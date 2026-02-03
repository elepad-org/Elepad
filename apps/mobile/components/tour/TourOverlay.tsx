import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useTourContext } from './TourProvider';
import { TourTooltip } from './TourTooltip';
import { COLORS } from '@/styles/base';

const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

export const TourOverlay: React.FC = () => {
  const { state, nextStep, prevStep, stopTour } = useTourContext();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isReady, setIsReady] = useState(false);
  const [dots, setDots] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // Auto-measure state

  // Animated dots for loading text
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isReady || canvasSize.width === 0 || state.isPreparing) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isReady, canvasSize.width, state.isPreparing]);

  const currentStep = state.steps[state.currentStepIndex];
  const layout = currentStep?.layout;

  // New Check: Is the *Target* layout ready? (Not just the overlay)
  const isStepLayoutReady = !!(layout && layout.width > 0 && layout.height > 0);

  // Reset ready state when step changes or tour becomes inactive
  useEffect(() => {
    if (!state.isActive) {
      setIsReady(false);
      return;
    }

    // Delay to allow layout to settle and prevent flicker
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [state.isActive, state.currentStepIndex]);

  useEffect(() => {
    // Only fade in if active, ready, AND we have measured dimensions
    // Also fade in if preparing (to show loading screen)
    if ((state.isActive && isReady && canvasSize.width > 0) || state.isPreparing) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state.isActive, state.isPreparing, isReady, fadeAnim, canvasSize.width]);

  if ((!state.isActive && !state.isPreparing)) {
    return null;
  }

  // Handle StatusBar offset difference between Expo Go (Dev) and Production (APK/Store)
  // In Expo Go, measureInWindow typically excludes StatusBar, so we ADD it.
  // In Production, measureInWindow includes absolute screen coordinates, so we add 0.
  const additionalOffset = STATUS_BAR_HEIGHT;

  // Spotlight Y calculation
  const spotlightY = (layout?.y || 0) + additionalOffset;

  const spotlightX = layout?.x || 0;
  const spotlightWidth = layout?.width || 0;
  const spotlightHeight = layout?.height || 0;

  const padding = 8;
  const highlightX = Math.max(0, spotlightX - padding);
  const highlightWidth = Math.min(spotlightWidth + padding * 2, canvasSize.width - highlightX);
  const highlightHeight = spotlightHeight + padding * 2;

  // Calculate specific Y for Border and SVG
  // Border uses status bar offset because View coordinates include status bar area
  const highlightY = Math.max(0, spotlightY - padding);
  // SVG should match the border position
  const highlightY_SVG = Math.max(0, spotlightY - padding);

  // Calculate tooltip position (below spotlight by default)
  const tooltipY = highlightY + highlightHeight + 20;
  const tooltipX = canvasSize.width / 2;

  // Logic to determine Y position
  let finalTooltipY = tooltipY;
  const tooltipFitsBelow = tooltipY + 300 < canvasSize.height;
  const positionAbove = Math.max(20, highlightY - 320);

  if (currentStep?.side === 'top') {
    finalTooltipY = positionAbove;
  } else if (currentStep?.side === 'bottom') {
    finalTooltipY = tooltipY;
  } else {
    // Auto (default)
    finalTooltipY = tooltipFitsBelow ? tooltipY : positionAbove;
  }

  return (
    <Modal
      visible={state.isActive || state.isPreparing}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.container, { opacity: fadeAnim }]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          // Only update if dimensions changed significantly to avoid loops
          if (
            Math.abs(width - canvasSize.width) > 1 ||
            Math.abs(height - canvasSize.height) > 1
          ) {
            console.log('📐 TourOverlay: Measured canvas:', width, height);
            setCanvasSize({ width, height });
          }
        }}
      >
        {/* Loading State: Show while measuring or waiting for debounce OR preparing OR waiting for target step layout */}
        {(!isReady || canvasSize.width === 0 || state.isPreparing || !isStepLayoutReady) && (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Iniciando guía{dots}</Text>
          </View>
        )}

        {/* SVG Mask Layer - Only show when ready AND measured AND active AND step layout ready */}
        {isReady && canvasSize.width > 0 && state.isActive && isStepLayoutReady && (
          <View style={StyleSheet.absoluteFill}>
            <Svg
              height="100%"
              width="100%"
              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              preserveAspectRatio="none"
            >
              <Defs>
                <Mask id="mask" x="0" y="0" width="100%" height="100%">
                  {/* White rect covers everything (visible) */}
                  <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Black rect at spotlight position (transparent hole) */}
                  <Rect
                    x={highlightX}
                    y={highlightY_SVG}
                    width={highlightWidth}
                    height={highlightHeight}
                    rx={16}
                    ry={16}
                    fill="black"
                  />
                </Mask>
              </Defs>
              {/* The actual dark overlay, masked */}
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.75)"
                mask="url(#mask)"
              />
            </Svg>
          </View>
        )}

        {/* Border Highlight (Visual only, sits on top) */}
        {isReady && state.isActive && isStepLayoutReady && (
          <View
            style={[
              styles.spotlightBorder,
              {
                left: highlightX,
                top: highlightY,
                width: highlightWidth,
                height: highlightHeight,
              },
            ]}
          />
        )}

        {/* Tooltip */}
        {isReady && state.isActive && isStepLayoutReady && currentStep && (
          <View
            style={[
              styles.tooltipContainer,
              {
                top: finalTooltipY,
                left: tooltipX,
                transform: [{ translateX: -170 }], // Half of TOOLTIP_WIDTH estimated
              },
            ]}
          >
            <TourTooltip
              text={currentStep.text}
              title={currentStep.title}
              currentStep={state.currentStepIndex + 1}
              totalSteps={state.steps.length}
              isFirstStep={state.currentStepIndex === 0}
              isLastStep={state.currentStepIndex === state.steps.length - 1}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={stopTour}
            />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 16, // Matches the rx/ry in SVG
    backgroundColor: 'transparent',
    pointerEvents: 'none', // Allow clicks through? Actually Modal blocks anyway.
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', // Match overlay color
    zIndex: 2000,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 120, // Prevent jitter
    textAlign: 'center',
  },
});
