import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import { useTourContext } from './TourProvider';
import { TourTooltip } from './TourTooltip';
import { COLORS } from '@/styles/base';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // NO remeasure on step change - all positions already measured at tour start!
  // Remeasuring causes a flash because the overlay renders before measureInWindow completes

  if (!state.isActive || !currentStep) {
    return null;
  }

  // Get status bar height - this is the offset we need to add
  const statusBarHeight = StatusBar.currentHeight || 0;

  // Calculate spotlight position - ADD status bar height to Y coordinate
  const spotlightX = layout?.x || 0;
  const spotlightY = (layout?.y || 0) + statusBarHeight; // CRITICAL: Add status bar offset
  const spotlightWidth = layout?.width || 100;
  const spotlightHeight = layout?.height || 100;

  // Add padding around spotlight
  const padding = 8;
  const highlightX = Math.max(0, spotlightX - padding);
  const highlightY = Math.max(0, spotlightY - padding);
  const highlightWidth = Math.min(spotlightWidth + padding * 2, SCREEN_WIDTH - highlightX); // Don't overflow screen
  const highlightHeight = spotlightHeight + padding * 2;

  // Calculate tooltip position (below spotlight by default)
  const tooltipY = highlightY + highlightHeight + 20;
  const tooltipX = SCREEN_WIDTH / 2;

  // If tooltip would be off-screen, position it above
  const tooltipFitsBelow = tooltipY + 300 < SCREEN_HEIGHT;
  const finalTooltipY = tooltipFitsBelow ? tooltipY : Math.max(20, highlightY - 320);

  // Debug logging
  console.log('🎨 TourOverlay render:', {
    isActive: state.isActive,
    stepIndex: state.currentStepIndex,
    stepText: currentStep?.text?.substring(0, 50),
    statusBarHeight,
    rawLayout: layout,
    adjusted: { x: spotlightX, y: spotlightY },
    spotlight: { x: highlightX, y: highlightY, width: highlightWidth, height: highlightHeight },
    tooltipY: finalTooltipY,
  });

  return (
    <Modal
      visible={state.isActive}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Full semi-transparent overlay */}
        <View style={styles.darkOverlay} />

        {/* Highlighted box around target element */}
        <View
          style={[
            styles.spotlight,
            {
              position: 'absolute',
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
              transform: [{ translateX: -170 }], // Half of TOOLTIP_WIDTH
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
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlight: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slight white tint to make it visible
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
});
