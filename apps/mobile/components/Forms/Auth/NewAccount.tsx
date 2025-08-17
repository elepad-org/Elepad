import { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  RadioButton,
} from "react-native-paper";
import useAuth from "@/hooks/useAuth";

type Props = { onBack: () => void };

export default function NewAccount({ onBack }: Props) {
  const { newUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [belongsGroup, setBelongsGroup] = useState<"si" | "no">("no");
  const [groupCode, setGroupCode] = useState("");

  const handleSubmit = () => {
    newUser({
      username,
      email,
      password,
      belongsGroup: belongsGroup === "si",
      groupCode: belongsGroup === "si" ? groupCode : undefined,
    });
  };

  return (
    <Surface style={styles.surface} elevation={2}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Crear Cuenta
        </Text>

        <TextInput
          mode="outlined"
          label="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Clave"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          style={styles.input}
        />

        <Surface style={styles.groupCard} elevation={0}>
          <Text variant="titleSmall" style={styles.groupTitle}>
            ¿Pertenecés a un grupo familiar?
          </Text>
          <RadioButton.Group
            onValueChange={(v) => setBelongsGroup(v as "si" | "no")}
            value={belongsGroup}
          >
            <View style={styles.radioRow}>
              <RadioButton value="si" />
              <Text style={styles.radioLabel}>
                Sí, pertenezco a un grupo familiar
              </Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="no" />
              <Text style={styles.radioLabel}>No</Text>
            </View>
          </RadioButton.Group>

          {belongsGroup === "si" && (
            <TextInput
              mode="outlined"
              label="Código del grupo"
              value={groupCode}
              onChangeText={setGroupCode}
              style={[styles.input, { marginTop: 8 }]}
            />
          )}
        </Surface>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Crear Cuenta
        </Button>

        <Button mode="text" onPress={onBack} style={styles.backButton}>
          Volver
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    marginTop: 50,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginVertical: 8,
  },
  groupCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  groupTitle: {
    marginBottom: 4,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 4,
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 8,
  },
});
