import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useTourContext } from './TourProvider';
import { TourTooltip } from './TourTooltip';
import { COLORS } from '@/styles/base';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const CANVAS_HEIGHT = WINDOW_HEIGHT + STATUS_BAR_HEIGHT;

export const TourOverlay: React.FC = () => {
  const { state, nextStep, prevStep, stopTour } = useTourContext();
  const [fadeAnim] = useState(new Animated.Value(0));

  const currentStep = state.steps[state.currentStepIndex];
  const layout = currentStep?.layout;

  useEffect(() => {
    if (state.isActive) {
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
  }, [state.isActive, fadeAnim]);

  if (!state.isActive || !currentStep) {
    return null;
  }

  // Border needs status bar offset to match screen coordinates correctly in the absolute view
  const spotlightY = (layout?.y || 0) + STATUS_BAR_HEIGHT;

  const spotlightX = layout?.x || 0;
  const spotlightWidth = layout?.width || 0;
  const spotlightHeight = layout?.height || 0;

  // Add padding around spotlight
  const padding = 8;
  const highlightX = Math.max(0, spotlightX - padding);
  const highlightWidth = Math.min(spotlightWidth + padding * 2, SCREEN_WIDTH - highlightX);
  const highlightHeight = spotlightHeight + padding * 2;

  // Calculate specific Y for Border and SVG
  // Border uses status bar offset because View coordinates include status bar area
  const highlightY = Math.max(0, spotlightY - padding);
  // SVG should match the border position
  const highlightY_SVG = Math.max(0, spotlightY - padding);

  // Calculate tooltip position (below spotlight by default)
  const tooltipY = highlightY + highlightHeight + 20;
  const tooltipX = SCREEN_WIDTH / 2;

  // If tooltip would be off-screen, position it above
  const tooltipFitsBelow = tooltipY + 300 < CANVAS_HEIGHT;
  const finalTooltipY = tooltipFitsBelow ? tooltipY : Math.max(20, highlightY - 320);

  return (
    <Modal
      visible={state.isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* SVG Mask Layer */}
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${CANVAS_HEIGHT}`}>
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

        {/* Border Highlight (Visual only, sits on top) */}
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

        {/* Tooltip */}
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
});
