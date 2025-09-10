import { View, StyleSheet, StatusBar } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import CalendarCard from "@/components/Calendar/CalendarCard";
import { COLORS, STYLES as baseStyles } from "@/styles/base";
import { Text } from "react-native-paper";

export default function CalendarScreen() {
  const { userElepad } = useAuth();
  const userId = userElepad?.id ?? "user-1";

  return (
    <View style={baseStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Text style={[baseStyles.heading, { marginBottom: 16 }]}>Calendario</Text>
      <CalendarCard userId={userId} />
    </View>
  );
}
