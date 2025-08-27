import { supabase } from "@/lib/supabase";
import { View, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, Surface, useTheme } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import { useState, useRef } from "react";
import { Platform, Animated } from "react-native";
import googleLogo from "@/assets/images/google.png";
import { Link } from "expo-router";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  // Animated value for button scale
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      Alert.alert(error.message);
    } else {
      console.log("Inicio de sesión:", email);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectTo = makeRedirectUri({ scheme: "elepad", path: "/login" });
    console.log(redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      Alert.alert(error.message);
    }
    setLoading(false);
  };

  return (
    <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
      <View style={styles.containerPadding}>
        <Text variant="headlineSmall" style={[styles.heading, { color: colors.onSurface }]}>Iniciar Sesión</Text>
        <Text variant="bodyLarge" style={[styles.subheading, { color: colors.onSurfaceVariant }]}>Ingresa tu email y tu contraseña</Text>

        <TextInput
          mode="outlined"
          placeholder="Email"
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
          onSubmitEditing={handleLogin}
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
            onPress={handleLogin}
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

        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.85}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <View style={styles.gIconWrap}>
            <Image
              source={googleLogo}
              style={styles.gIconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.googleText, { color: colors.onSurfaceVariant }]}>Continuar con Google</Text>
        </TouchableOpacity>

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
  },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 12 },
  googleButton: {
    marginTop: 14,
    marginBottom: 20,
    width: "100%",
    backgroundColor: "#FEFEFE",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  gIconWrap: {
    position: "absolute",
    left: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  gIconImage: { width: 18, height: 18 },
  googleText: { fontSize: 15, fontWeight: "600" },
  inlineBack: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 14,
  },
});
