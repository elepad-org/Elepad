import { supabase } from "@/lib/supabase";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Portal,
  Dialog,
  Paragraph,
} from "react-native-paper";
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
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getFriendlyErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes("Invalid login credentials"))
      return "Credenciales inválidas. Verifica tu correo y contraseña.";
    if (errorMsg.includes("Email not confirmed"))
      return "Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.";
    if (errorMsg.includes("Password should be at least 6 characters"))
      return "La contraseña debe tener al menos 6 caracteres.";
    if (errorMsg.includes("Anonymous sign-ins are disabled"))
      return "Debe completar con los datos necesarios.";
    if (
      errorMsg.toLowerCase().includes("missing email") ||
      errorMsg === "Email is required"
    )
      return "Por favor ingresa tu correo electrónico.";
    return errorMsg;
  };

  const showError = (message: string) => {
    setErrorMessage(getFriendlyErrorMessage(message));
    setErrorVisible(true);
  };

  const isFormValid = () => {
    return email.trim() !== "" && password.trim() !== "";
  };

  const handleLogin = async () => {
    // Validar campos obligatorios
    if (!email.trim() || !password.trim()) {
      showError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      showError(error.message);
    } else {
      console.log("Inicio de sesión:", email);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/(tabs)/home`,
          },
        });

        if (error) showError(error.message);
        return;
      }

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
        showError(error.message);
        return;
      }

      console.log(data);

      const authUrl = data?.url;
      console.log(authUrl);
      if (authUrl) {
        // Abre el browser del telefono
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo
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
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Text style={styles.subtitle}>Ingresa tu email y tu contraseña</Text>

        <TextInput
          mode="outlined"
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          style={styles.input}
          outlineStyle={styles.inputOutline}
          outlineColor="rgba(203, 203, 203, 0.92)"
          activeOutlineColor={COLORS.textLight}
          textColor={COLORS.text}
          placeholderTextColor={COLORS.textSecondary}
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
          style={styles.input}
          outlineStyle={styles.inputOutline}
          outlineColor="rgba(203, 203, 203, 0.92)"
          activeOutlineColor={COLORS.textLight}
          textColor={COLORS.text}
          placeholderTextColor={COLORS.textSecondary}
          onSubmitEditing={handleLogin}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          buttonColor={COLORS.primary}
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !isFormValid()}
        >
          Continuar
        </Button>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>o</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, !isFormValid() || loading ? { opacity: 0.5 } : {}]}
          activeOpacity={0.85}
          onPress={handleGoogleLogin}
          disabled={loading || !isFormValid()}
        >
          <View style={styles.googleIconWrap}>
            <Image
              source={googleLogo}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={styles.backLink}
        >
          <Text style={styles.backText}>Volver</Text>
        </Link>
      </View>

      <Portal>
        <Dialog
          visible={errorVisible}
          onDismiss={() => setErrorVisible(false)}
          style={{
            backgroundColor: COLORS.background,
            borderRadius: 20,
            width: "90%",
            alignSelf: "center",
          }}
        >
          <Dialog.Icon
            icon="alert-circle-outline"
            size={48}
            color={COLORS.primary}
          />

          <Dialog.Content>
            <Paragraph style={{ ...STYLES.subheading, marginTop: 12 }}>
              {errorMessage}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions
            style={{ justifyContent: "center", paddingBottom: 16 }}
          >
            <Button
              mode="contained"
              onPress={() => setErrorVisible(false)}
              buttonColor={COLORS.primary}
              textColor={COLORS.white}
              style={{ paddingHorizontal: 24, borderRadius: 12 }}
            >
              Aceptar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 14,
    backgroundColor: "transparent",
  },
  inputOutline: {
    borderRadius: 12,
  },
  primaryButton: {
    marginTop: 8,
    width: "100%",
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(84, 83, 83, 0.3)",
  },
  orText: {
    marginHorizontal: 16,
    color: "rgba(100, 97, 97, 0.7)",
    fontSize: 14,
  },
  googleButton: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  backLink: {
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
