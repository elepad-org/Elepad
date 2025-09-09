import { supabase } from "@/lib/supabase";
import { View, Alert, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import { useState } from "react";
import googleLogo from "@/assets/images/google.png";
import { Link } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";

export default function LogIn() {
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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
      }}
    >
      <View
        style={[
          STYLES.titleCard,
          {
            backgroundColor: COLORS.accent,
            borderRadius: 20,
            padding: 20,
            width: "100%",
            maxWidth: 400,
            alignItems: "center",
          },
        ]}
      >
        <Text style={STYLES.heading}>Iniciar Sesión</Text>
        <Text style={[STYLES.subheading, { marginTop: 8 }]}>
          Ingresa tu email y tu contraseña
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={STYLES.input}
          outlineStyle={STYLES.inputOutline}
          disabled={loading}
          dense
        />
        <TextInput
          mode="outlined"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          style={STYLES.input}
          outlineStyle={STYLES.inputOutline}
          onSubmitEditing={handleLogin}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={STYLES.buttonContent}
          style={STYLES.buttonPrimary}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
        >
          Continuar
        </Button>

        <View style={STYLES.orRow}>
          <View style={STYLES.orLine} />
          <Text style={STYLES.orText}>o</Text>
          <View style={STYLES.orLine} />
        </View>

        <TouchableOpacity
          style={STYLES.buttonGoogle}
          activeOpacity={0.85}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <View style={STYLES.googleIconWrap}>
            <Image
              source={googleLogo}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </View>
          <Text style={STYLES.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={[STYLES.subheading, { textAlign: "center", marginTop: 23 }]}
        >
          <Text style={[STYLES.subheading]}> Volver</Text>
        </Link>
      </View>
    </View>
  );
}
