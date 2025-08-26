import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";

type Props = { onBack: () => void };

export default function LogIn({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      Alert.alert(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectTo = makeRedirectUri({ scheme: "elepad" });
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
    <View style={styles.card}>
      <Text style={styles.heading}>Iniciar Sesión</Text>
      <Text style={styles.subheading}>
        Ingresa tu correo y contraseña para entrar
      </Text>

      <TextInput
        mode="outlined"
        label="Email"
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
        onSubmitEditing={handleLogin}
        style={styles.input}
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        contentStyle={styles.continueContent}
        style={styles.continueButton}
        labelStyle={styles.continueLabel}
        loading={loading}
        disabled={loading}
      >
        Entrar
      </Button>

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>o</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <View style={styles.gIconWrap}>
          <Text style={styles.gIcon}>G</Text>
        </View>
        <Text style={styles.googleText}>Entrar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onBack}
        disabled={loading}
        style={styles.backTouch}
      >
        <Text style={styles.backLabel}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    marginTop: 18,
    padding: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    borderRadius: 12,
  },
  heading: {
    fontSize: 20,
    fontFamily: "JosefinSans",
    fontWeight: "600",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Montserrat",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 8,
  },
  continueButton: {
    marginTop: 12,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#5F76E8",
  },
  continueContent: { height: 48 },
  continueLabel: { fontSize: 16, fontWeight: "600" },
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
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: "#E6E3E0",
  },
  gIcon: { fontWeight: "700", color: "#DB4437" },
  googleText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "Montserrat",
    fontWeight: "600",
  },
  backTouch: { marginTop: 12 },
  backLabel: { fontSize: 16, color: "#5F76E8" },
});
