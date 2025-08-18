import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, Surface } from "react-native-paper";

type Props = { onBack: () => void };

export default function NewAccount({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert("Success", "Please check your email for confirmation.");
    }
    setLoading(false);
  };

  return (
    <Surface style={styles.surface} elevation={2}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Crear Cuenta
        </Text>

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
          disabled={loading}
        />

        <TextInput
          mode="outlined"
          label="Clave"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleSignUp}
          style={styles.input}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleSignUp}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Crear Cuenta
        </Button>

        <Button
          mode="text"
          onPress={onBack}
          style={styles.backButton}
          disabled={loading}
        >
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
