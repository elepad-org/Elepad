import { View, StyleSheet, StatusBar } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import CalendarCard from "@/components/Calendar/CalendarCard";
import { COLORS, STYLES as baseStyles } from "@/styles/base";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const { userElepad } = useAuth();
  const userId = userElepad?.id ?? "";

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[baseStyles.container]}>
        <Text style={[baseStyles.heading]}>Calendario</Text>
        <CalendarCard userId={userId} />
      </View>
    </SafeAreaView>
  );
}
