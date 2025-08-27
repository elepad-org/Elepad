import { supabase } from "@/lib/supabase";
import { View, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, Surface } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import React, { useState, useRef } from "react";
import { Platform, Animated } from "react-native";
import googleLogo from "@/assets/images/google.png";
import { Link } from "expo-router";
import { FONT } from "@/styles/theme";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <Surface style={styles.surface} elevation={2}>
      <View style={styles.containerPadding}>
        <Text style={styles.heading}>Iniciar Sesión</Text>
        <Text style={styles.subheading}>Ingresa tu email y tu contraseña</Text>

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
            style={styles.continueButton}
            labelStyle={styles.continueLabel}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          >
            Continuar
          </Button>
        </Animated.View>
        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>o</Text>
          <View style={styles.line} />
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
          <Text style={styles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={styles.inlineBack}
        >
          Volver
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
    backgroundColor: "#FFF9F1",
  },
  containerPadding: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontFamily: FONT.semiBold,
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
  backLabel: {
    fontSize: 16,
    fontFamily: FONT.regular,
  },
  safe: { flex: 1, backgroundColor: "#FFF9F1" },
  container: { flex: 1, alignItems: "center" },
  logoWrap: { alignItems: "center" },
  logo: { width: 185, height: 185 },
  brand: {
    marginTop: 20,
    fontSize: 44,
    letterSpacing: 8,
    fontFamily: FONT.regular,
  },
  separatorWrap: { width: "100%", alignItems: "center", marginTop: 6 },
  separator: { width: "60%", height: 1, backgroundColor: "#111", opacity: 0.9 },
  card: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    marginTop: 6,
    fontFamily: FONT.semiBold,
    textAlign: "center",
  },
  subheading: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    fontFamily: FONT.semiBold,
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
    backgroundColor: "#5278CD",
  },
  continueContent: { height: 48 },
  continueLabel: { fontSize: 16, fontFamily: FONT.semiBold },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  line: { flex: 1, height: 1, backgroundColor: "#E6E3E0" },
  orText: { marginHorizontal: 12, color: "#999" },
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
  googleText: { fontSize: 15, fontFamily: FONT.semiBold },
  inlineBack: {
    textAlign: "center",
    fontFamily: FONT.regular,
    fontSize: 14,
    color: "#666",
  },
  footer: {
    marginTop: 18,
    color: "#B2AFAE",
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
});
