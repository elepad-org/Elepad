import { supabase } from "@/lib/supabase";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";

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

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Ingrese sus datos personales</Text>

        <TextInput
          mode="outlined"
          placeholder="Nombre de usuario"
          value={displayName}
          onChangeText={setDisplayName}
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
          placeholder="Correo"
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
          placeholder="Código familiar (opcional)"
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="characters"
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
          onSubmitEditing={handleSignUp}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          buttonColor={COLORS.primary}
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
        >
          Continuar
        </Button>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>o</Text>
          <View style={styles.orLine} />
        </View>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={styles.backLink}
        >
          <Text style={styles.backText}>Volver</Text>
        </Link>
      </View>
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
  backLink: {
    marginTop: 24,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
