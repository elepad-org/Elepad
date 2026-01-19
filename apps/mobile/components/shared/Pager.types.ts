import type { StyleProp, ViewStyle } from "react-native";

export type PagerOnPageSelectedEvent = {
  nativeEvent: {
    position: number;
  };
};

export type PagerRef = {
  setPage: (index: number) => void;
};

export type PagerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  onPageSelected?: (event: PagerOnPageSelectedEvent) => void;
};
