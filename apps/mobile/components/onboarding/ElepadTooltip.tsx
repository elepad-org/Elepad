import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { TooltipProps } from 'rn-tourguide';
import { COLORS, FONT, SHADOWS } from '@/styles/base';
import eleIdea from '@/assets/images/ele-idea.png';
import { Button } from 'react-native-paper';

export default function ElepadTooltip({
  isLastStep,
  handleNext,
  handleStop,
  currentStep,
}: TooltipProps) {

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Elepad Character */}
        <Image source={eleIdea} style={styles.character} resizeMode="contain" />

        {/* Speech Bubble */}
        <View style={styles.bubble}>
          {currentStep && (
            <View style={styles.header}>
              <Text style={styles.title}>{currentStep.text}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Button
              mode="text"
              onPress={handleStop}
              textColor={COLORS.textSecondary}
              compact
              labelStyle={styles.skipLabel}
            >
              Saltar
            </Button>

            <Button
              mode="contained"
              onPress={isLastStep ? handleStop : handleNext}
              buttonColor={COLORS.primary}
              compact
              style={styles.nextButton}
            >
              {isLastStep ? 'Finalizar' : 'Siguiente'}
            </Button>
          </View>

          {/* Arrow pointing left (towards Elepad) */}
          <View style={styles.arrowContainer}>
            <View style={styles.arrow} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    maxWidth: 400,
    alignSelf: 'center',
    width: Dimensions.get('window').width - 32,
    zIndex: 999,
    // backgroundColor: 'rgba(255, 0, 0, 0.2)', // Debug
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  character: {
    width: 90,
    height: 90,
    marginRight: -10,
    zIndex: 2,
    marginBottom: -10,
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    ...SHADOWS.medium,
    zIndex: 1,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontFamily: FONT.medium,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  skipLabel: {
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  nextButton: {
    borderRadius: 8,
  },
  arrowContainer: {
    position: 'absolute',
    left: -10,
    bottom: 30,
    width: 20,
    height: 20,
    zIndex: 0,
    overflow: 'hidden',
  },
  arrow: {
    width: 14,
    height: 14,
    backgroundColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 6,
    marginTop: 3,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primary + '20',
  }
});
