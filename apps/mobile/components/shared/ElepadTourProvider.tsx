import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { TourGuideProvider } from 'rn-tourguide';
import ElepadTooltip from '@/components/onboarding/ElepadTooltip';

interface ElepadTourProviderProps {
  children: React.ReactNode;
}

export const ElepadTourProvider: React.FC<ElepadTourProviderProps> = ({ children }) => {
  return (
    <TourGuideProvider
      tooltipComponent={ElepadTooltip}
      backdropColor="rgba(0, 0, 0, 0.85)"
      verticalOffset={Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0}
      animationDuration={400}
      preventOutsideInteraction={true}
      androidStatusBarVisible={false}
    >
      {children}
    </TourGuideProvider>
  );
};
