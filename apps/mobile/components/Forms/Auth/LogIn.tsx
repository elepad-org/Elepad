import { supabase } from "@/lib/supabase";
import { View, Alert, Image, TouchableOpacity } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import googleLogo from "@/assets/images/google.png";
import { Link } from "expo-router";
import { COLORS, STYLES } from "@/styles/base";

export default function LogIn() {
  const router = useRouter();
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
    try {
      setLoading(true);
      const redirectTo = makeRedirectUri({
        scheme: "elepad",
        path: "(tabs)/home",
      });
      console.log("Redirect URI (native):", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      console.log(data);

      const authUrl = data?.url;
      console.log(authUrl);
      if (authUrl) {
        // Abre el browser del telefono
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo,
        );
        console.log(result);
        if (result.type === "success" && result.url) {
          //Se parsea la URL que devuelve, ya que tiene los tokens de sesion
          const parseParams = (u: string) => {
            try {
              const params: Record<string, string> = {};
              const hashIndex = u.indexOf("#");
              const queryIndex = u.indexOf("?");
              const raw =
                hashIndex !== -1
                  ? u.substring(hashIndex + 1)
                  : queryIndex !== -1
                    ? u.substring(queryIndex + 1)
                    : "";
              raw.split("&").forEach((pair) => {
                const [k, v] = pair.split("=");
                if (k && v)
                  params[decodeURIComponent(k)] = decodeURIComponent(v);
              });
              return params;
            } catch (e) {
              console.log(e);
              return {} as Record<string, string>;
            }
          };

          const params = parseParams(result.url);
          const access_token = params["access_token"];
          const refresh_token = params["refresh_token"];

          try {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          } catch (e) {
            console.warn("No se pudo establecer la sesión con los tokens:", e);
          }

          // Confirma usuario y redirige al inicio
          try {
            const userRes = await supabase.auth.getUser();
            const user = userRes?.data?.user;
            if (user) {
              router.replace("/(tabs)/home");
              return;
            } else {
              router.replace("/login");
            }
          } catch (error) {
            console.warn("No se pudo verificar el usuario de OAuth:", error);
            router.replace("/login");
          }
        }
      }
    } finally {
      setLoading(false);
    }
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
