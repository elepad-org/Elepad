import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Surface, TextInput, Button, Text, Portal, Dialog } from "react-native-paper";

type Props = { onBack: () => void };

export default function NewAccount({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Function to get modal error message based on status code (could be more, just saw these)
  const getErrorMessage = (error: any) => {
    if (error.code === 'weak_password') return "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
    if( error.code === 'validation_failed') return "El correo electrónico no es válido.";
    if (error.code === 'email_exists') return "Este correo ya está asociado a una cuenta.";
    if (error.code === 'email_address_invalid') return "La dirección de correo no es válida.";
    return error.message || "Ocurrió un error inesperado. Intente nuevamente por favor."; // This is for status 500 (supabase gets lazy)
  };


  const handleSignUp = async () => {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { displayName, passwordHash:password } },
    });
    if (error) {
      console.log(error);
      setModalMessage(getErrorMessage(error));
      setModalVisible(true);
    } else {
      console.log("User created:", data);
      setModalMessage("Cuenta creada. Revisa tu correo para confirmar.");
      setModalVisible(true);
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
          label="Nombre de usuario"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          style={styles.input}
          disabled={loading}
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

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Atención</Dialog.Title>
          <Dialog.Content>
            <Text>{modalMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
