import { PropsWithChildren } from "react";
import { SafeAreaView, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

type ThemedSafeAreaViewProps = PropsWithChildren & {
  style?: StyleProp<ViewStyle>;
}

export function ThemedSafeAreaView({ children, style }: ThemedSafeAreaViewProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[{ backgroundColor: colors.background }, styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
