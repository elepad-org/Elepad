import { supabase } from "@/lib/supabase";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { TextInput, Button, Text, Switch } from "react-native-paper";
import { COLORS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";

export default function NewAccount() {
  const { refreshUserElepad } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [isElder, setIsElder] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { displayName, elder: isElder } },
      });
      
      if (error) {
        Alert.alert("Error al crear cuenta", error.message);
        setLoading(false);
        return;
      }
      
      if (!data.session) {
        Alert.alert(
          "Verificación requerida",
          "Por favor verifica tu correo electrónico para continuar"
        );
        setLoading(false);
        return;
      }

      // Handle family group
      if (!familyCode) {
        // Create new family group
        try {
          const res = await postFamilyGroupCreate({
            name: displayName,
            ownerUserId: data.session.user.id,
          });
          if (!res) {
            Alert.alert(
              "Advertencia",
              "La cuenta se creó pero hubo un problema al crear el grupo familiar"
            );
          } else {
            // Wait a bit for the database to update
            await new Promise(resolve => setTimeout(resolve, 500));
            // Refresh user data to get the new groupId
            await refreshUserElepad();
          }
        } catch (err: any) {
          console.error("Error creating family group:", err);
          Alert.alert(
            "Advertencia",
            `La cuenta se creó pero hubo un problema al crear el grupo familiar: ${err.message || "Error desconocido"}`
          );
        }
      } else {
        // Link to existing family group
        try {
          const res = await postFamilyGroupLink({
            invitationCode: familyCode,
            userId: data.session.user.id,
          });
          if (!res) {
            Alert.alert(
              "Advertencia",
              "La cuenta se creó pero no se pudo vincular al grupo familiar. Verifica el código."
            );
          } else {
            // Wait a bit for the database to update
            await new Promise(resolve => setTimeout(resolve, 500));
            // Refresh user data to get the new groupId
            await refreshUserElepad();
          }
        } catch (err: any) {
          console.error("Error linking to family group:", err);
          Alert.alert(
            "Advertencia",
            `La cuenta se creó pero no se pudo vincular al grupo familiar: ${err.message || "Código inválido o expirado"}`
          );
        }
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert("Error", err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
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

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>¿Es adulto mayor?</Text>
          <Switch
            value={isElder}
            onValueChange={setIsElder}
            color={COLORS.primary}
            disabled={loading}
          />
        </View>

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
  switchContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
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
