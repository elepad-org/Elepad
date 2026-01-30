import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, FONT, SHADOWS } from '@/styles/base';
import eleImage from '@/assets/images/ele-idea.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOOLTIP_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

interface TourTooltipProps {
  text: string;
  title?: string;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  text,
  title,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
}) => {
  return (
    <View style={styles.container}>
      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Image source={eleImage} style={styles.mascotImage} resizeMode="contain" />
      </View>

      {/* Speech Bubble */}
      <View style={styles.bubble}>
        {/* Triangle pointer */}
        <View style={styles.triangle} />

        {/* Content */}
        <View style={styles.content}>
          {/* Step indicator */}
          <Text style={styles.stepIndicator}>
            Paso {currentStep} de {totalSteps}
          </Text>

          {/* Title (optional) */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          <Text style={styles.message}>{text}</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Skip button */}
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Saltar</Text>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              {/* Previous button */}
              {!isFirstStep && (
                <TouchableOpacity onPress={onPrev} style={styles.prevButton}>
                  <Text style={styles.prevButtonText}>Atrás</Text>
                </TouchableOpacity>
              )}

              {/* Next/Finish button */}
              <TouchableOpacity onPress={onNext} style={[styles.nextButton, isFirstStep && styles.nextButtonFull]}>
                <Text style={styles.nextButtonText}>
                  {isLastStep ? '¡Entendido!' : 'Siguiente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    maxWidth: TOOLTIP_WIDTH,
  },
  mascotContainer: {
    width: 100,
    height: 100,
    marginBottom: -20,
    zIndex: 2,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    ...SHADOWS.card,
    paddingTop: 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    minWidth: TOOLTIP_WIDTH,
    elevation: 10,
    zIndex: 1,
  },
  triangle: {
    position: 'absolute',
    top: 15,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
  content: {
    gap: 12,
  },
  stepIndicator: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonsContainer: {
    marginTop: 8,
    gap: 12,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  prevButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    color: COLORS.white,
  },
});
