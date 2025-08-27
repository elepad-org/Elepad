import { supabase } from "@/lib/supabase";
import { FONT } from "@/styles/theme";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Surface, TextInput, Button, Text } from "react-native-paper";

export default function NewAccount() {
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
      console.log(error);
    }
    if (!data.session) {
      console.log("No se pudo crear un grupo familiar");
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
        console.log("No se pudo crear un grupo familiar");
      }
    } else {
      const res = await postFamilyGroupLink({
        groupCode: familyCode,
        userId: data.session.user.id,
      });
      if (!res) {
        console.log("No se pudo vincular al grupo familiar");
      }
    }
    setLoading(false);
  };

  const buttonScale = useRef(new Animated.Value(1)).current;

  return (
    <Surface style={styles.surface} elevation={2}>
      <View style={styles.containerPadding}>
        <Text style={styles.heading}>Crear Cuenta</Text>
        <Text style={styles.subheading}>Ingrese sus datos personales </Text>

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
          placeholder="Código del grupo familiar"
          value={familyCode}
          onChangeText={setFamilyCode}
          keyboardType="email-address"
          autoCapitalize="characters"
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
            style={styles.continueButton}
            labelStyle={styles.continueLabel}
            onPress={handleSignUp}
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
    fontFamily: FONT.semiBold,
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
    marginBottom: 4,
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
    marginBottom: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: "#E6E3E0" },
  orText: { marginHorizontal: 12, color: "#999" },
  inlineBack: {
    textAlign: "center",
    fontFamily: FONT.regular,
    fontSize: 14,
    color: "#666",
  },
});
