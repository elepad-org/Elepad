import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Surface, TextInput, Button, Text, useTheme } from "react-native-paper";

export default function NewAccount() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { displayName, passwordHash: password } },
    });
    if (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const buttonScale = useRef(new Animated.Value(1)).current;

  return (
    <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
      <View style={styles.containerPadding}>
        <Text variant="headlineSmall" style={[styles.heading, { color: colors.onSurface }]}>Crear Cuenta</Text>
        <Text variant="bodyLarge" style={[styles.subheading, { color: colors.onSurfaceVariant }]}>Ingrese sus datos personales </Text>

        <TextInput
          mode="outlined"
          placeholder="Nombre de usuario"
          value={displayName}
          onChangeText={setDisplayName}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          disabled={loading}
          dense
        />
        <TextInput
          mode="outlined"
          placeholder="Correo "
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          disabled={loading}
          dense
        />
        <TextInput
          mode="outlined"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          onSubmitEditing={handleSignUp}
          disabled={loading}
          dense
        />
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            width: "100%",
          }}
        >
          <Button
            mode="contained"
            contentStyle={styles.continueContent}
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            labelStyle={styles.continueLabel}
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
          >
            Continuar
          </Button>
        </Animated.View>
        <View style={styles.orRow}>
          <View style={[styles.line, { backgroundColor: colors.outline }]} />
          <Text style={[styles.orText, { color: colors.onSurfaceVariant }]}>o</Text>
          <View style={[styles.line, { backgroundColor: colors.outline }]} />
        </View>

        <Link href={{ pathname: "/" }} accessibilityRole="button">
          <Text style={[styles.inlineBack, { color: colors.onSurfaceVariant }]}>Volver</Text>
        </Link>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    marginTop: 235,
    marginHorizontal: 16,
    borderRadius: 20,
  },
  containerPadding: {
    padding: 20,
  },
  heading: {
    marginTop: 6,
    textAlign: "center",
  },
  subheading: {
    marginTop: 8,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 8,
  },
  inputOutline: { borderRadius: 8 },
  continueButton: {
    marginTop: 12,
    marginBottom: 4,
    width: "100%",
    borderRadius: 8,
  },
  continueContent: { height: 48 },
  continueLabel: { fontSize: 16, fontWeight: "600" },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  line: { flex: 1, height: 0.5 },
  orText: { marginHorizontal: 12 },
  inlineBack: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 14,
  },
});
