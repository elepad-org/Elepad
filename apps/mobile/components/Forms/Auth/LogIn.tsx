import { supabase } from "@/lib/supabase";
import { View, Alert, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import React, { useState } from "react";
import googleLogo from "@/assets/images/google.png";
import { Link } from "expo-router";
import { COLORS, styles as baseStyles } from "@/styles/base";

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
          baseStyles.titleCard,
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
        <Text style={baseStyles.heading}>Iniciar Sesión</Text>
        <Text style={[baseStyles.subheading, { marginTop: 8 }]}>
          Ingresa tu email y tu contraseña
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
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
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
          onSubmitEditing={handleLogin}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={baseStyles.buttonContent}
          style={baseStyles.buttonPrimary}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
        >
          Continuar
        </Button>

        <View style={baseStyles.orRow}>
          <View style={baseStyles.orLine} />
          <Text style={baseStyles.orText}>o</Text>
          <View style={baseStyles.orLine} />
        </View>

        <TouchableOpacity
          style={baseStyles.buttonGoogle}
          activeOpacity={0.85}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <View style={baseStyles.googleIconWrap}>
            <Image
              source={googleLogo}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </View>
          <Text style={baseStyles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={[
            baseStyles.subheading,
            { textAlign: "center", marginTop: 23 },
          ]}
        >
          <Text style={[baseStyles.subheading]}> Volver</Text>
        </Link>
      </View>
    </View>
  );
}
