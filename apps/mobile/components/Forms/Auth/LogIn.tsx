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
      // NO usar useProxy. Crear un redirect con tu scheme (deep link).
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

      const authUrl = (data as any)?.url;
      console.log(authUrl);
      if (authUrl) {
        // Abre el navegador para el flujo OAuth; cuando Google redirija a `redirectTo`
        // el WebBrowser retornará con result.type === 'success' y result.url.
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo,
        );
        console.log(result);
        if (result.type === "success" && result.url) {
          // Algunas implementaciones de Supabase ofrecen helpers, pero aquí
          // parseamos manualmente los tokens que vienen en la URL (fragment o query)
          const parseParams = (u: string) => {
            try {
              const params: Record<string, string> = {};
              // Intenta usar la parte después de '#' primero (hash fragment)
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
              return {} as Record<string, string>;
            }
          };

          const params = parseParams(result.url);
          const access_token =
            params["access_token"] || params["access-token"] || undefined;
          const refresh_token =
            params["refresh_token"] || params["refresh-token"] || undefined;
          //const provider_token = params['provider_token'] || undefined;

          try {
            // Si tenemos un access_token, intentamos establecer la sesión localmente.
            if (access_token) {
              // supabase-js v2 expone setSession
              if (typeof (supabase.auth as any).setSession === "function") {
                await (supabase.auth as any).setSession({
                  access_token,
                  refresh_token,
                });
              } else if (typeof (supabase.auth as any).setAuth === "function") {
                // Fallback: algunas versiones exponen setAuth
                await (supabase.auth as any).setAuth(access_token);
              }
            }
          } catch (e) {
            console.warn("No se pudo establecer la sesión desde tokens:", e);
          }

          // Confirma usuario y redirige a la pantalla principal
          try {
            const userRes: any = await supabase.auth.getUser();
            const user = userRes?.data?.user;
            if (user) {
              router.replace("/(tabs)/home");
              return;
            }
            // Si no hay user, navegamos al home igualmente y la app deberá sincronizar
            router.replace("/(tabs)/home");
          } catch (e) {
            console.warn(
              "No se pudo verificar el usuario después de OAuth:",
              e,
            );
            router.replace("/(tabs)/home");
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
