import { View, StyleSheet } from "react-native";
import { Card, Text, List, Chip, useTheme } from "react-native-paper";

type Activity = {
  id: string;
  title: string;
  time: string;
  status: string;
};

const mockActivities: Activity[] = [
  { id: "1", title: "Terapia de lenguaje", time: "09:00", status: "Pendiente" },
  { id: "2", title: "Juego sensorial", time: "11:00", status: "Completada" },
  { id: "3", title: "Alimentación", time: "13:00", status: "Pendiente" },
];

const ActivitiesList = () => {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: Activity }) => {
    const cardStyle = {
      backgroundColor:
        item.status === "Completada"
          ? colors.primaryContainer
          : colors.secondaryContainer,
    };
    const textColor = 
        item.status === "Completada" ? colors.onPrimaryContainer : colors.onSecondaryContainer;
    const chipStyle = {
      backgroundColor:
        item.status === "Completada"
          ? colors.primary
          : colors.secondary,
    };

    return (
      <Card style={cardStyle} elevation={1}>
        <List.Item
          title={item.title}
          description={item.time}
          right={() => (
            <Chip
              icon={item.status == "Completada" ? "check" : "clock-outline"}
              style={[styles.chip, chipStyle]}
              textStyle={{ color: textColor, fontWeight: "bold" }}
            >
              {item.status == "Completada" ? "Completada" : "Pendiente"}
            </Chip>
          )}
          titleStyle={{ color: textColor, fontWeight: "800", fontSize: 16 }}
          descriptionStyle={{ color: textColor, fontSize: 15 }}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.onBackground }]}>Actividades de hoy</Text>
      <View style={styles.list}>
        {mockActivities.map((item, idx) => (
          <View key={item.id}>
            {renderItem({ item })}
            {idx < mockActivities.length - 1 && <View style={{ height: 8 }} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  list: {
    paddingBottom: 16,
  },
  chip: { alignSelf: "flex-start" },
});

export default ActivitiesList;
