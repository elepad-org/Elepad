import { supabase } from "@/lib/supabase";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { View, Alert, Image, TouchableOpacity, StyleSheet } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import googleLogo from "@/assets/images/google.png";

export default function NewAccount() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { displayName } },
    });
    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }
    if (!data.session) {
      Alert.alert("No se pudo crear un grupo familiar");
      setLoading(false);
      return;
    }
    if (!familyCode) {
      const res = await postFamilyGroupCreate({
        name: displayName,
        ownerUserId: data.session.user.id,
      });
      // TODO: The workflow when this fails needs to be defined!!
      if (!res) {
        Alert.alert("No se pudo crear un grupo familiar");
      }
    } else {
      const res = await postFamilyGroupLink({
        invitationCode: familyCode,
        userId: data.session.user.id,
      });
      if (!res) {
        Alert.alert("No se pudo vincular al grupo familiar");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const redirectTo = makeRedirectUri({
        scheme: "elepad",
        path: "(tabs)/home",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar.app.created",
          ].join(" "),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      const authUrl = data?.url;
      if (authUrl) {
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectTo,
        );

        if (result.type === "success" && result.url) {
          // Parse OAuth response
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

          // Verify user and redirect
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
        <Text style={STYLES.heading}>Crear Cuenta</Text>
        <Text style={[STYLES.subheading, { marginTop: 8 }]}>
          Ingrese sus datos personales
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Nombre de usuario"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          returnKeyType="next"
          style={STYLES.input}
          outlineStyle={STYLES.inputOutline}
          disabled={loading}
          dense
        />
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
          placeholder="Código familiar (opcional)"
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="characters"
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
          onSubmitEditing={handleSignUp}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={STYLES.buttonContent}
          style={STYLES.buttonPrimary}
          onPress={handleSignUp}
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
          style={styles.googleButton}
          activeOpacity={0.85}
          onPress={handleGoogleSignUp}
          disabled={loading}
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
          style={[STYLES.subheading, { textAlign: "center", marginTop: 23 }]}
        >
          <Text style={[STYLES.subheading]}> Volver</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
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
});
