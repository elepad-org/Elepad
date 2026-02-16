import { supabase } from "@/lib/supabase";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, Switch } from "react-native-paper";
import { COLORS } from "@/styles/base";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/shared/Toast";

export default function NewAccount() {
  const { refreshUserElepad } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [isElder, setIsElder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getFriendlyErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes("Invalid login credentials"))
      return "Credenciales inválidas. Verifica tu correo y contraseña.";
    if (errorMsg.includes("Email not confirmed"))
      return "Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.";
    if (errorMsg.includes("User already registered"))
      return "El usuario ya está registrado. Intenta iniciar sesión.";
    if (errorMsg.includes("Password should be at least 6 characters"))
      return "La contraseña debe tener al menos 6 caracteres.";
    if (errorMsg.includes("Anonymous sign-ins are disabled"))
      return "Debe completar con los datos necesarios.";
    if (
      errorMsg.toLowerCase().includes("missing email") ||
      errorMsg === "Email is required"
    )
      return "Por favor ingresa tu correo electrónico.";
    if (
      errorMsg.toLowerCase().includes("invalid email") ||
      errorMsg.toLowerCase().includes("unable to validate email address")
    )
      return "El formato del correo electrónico es inválido.";
    return errorMsg;
  };

  const showDialog = (
    message: string,
    icon: string = "alert-circle-outline",
  ) => {
    toast.showToast({
      message,
      type: icon === "email-check-outline" ? "success" : "error",
    });
  };

  const isFormValid = () => {
    return (
      email.trim() !== "" &&
      displayName.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      password === confirmPassword
    );
  };

  const handleSignUp = async () => {
    // Validar campos obligatorios
    if (!email.trim() || !displayName.trim() || !password.trim() || !confirmPassword.trim()) {
      showDialog("Por favor completa todos los campos obligatorios.");
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      showDialog("Las contraseñas no coinciden.");
      return;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      showDialog("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { displayName, elder: isElder } },
      });

      if (error) {
        showDialog(getFriendlyErrorMessage(error.message));
        setLoading(false);
        return;
      }

      // Si el usuario ya existe pero no tiene sesión (email no confirmado o provider), data.user existe pero data.session es null
      // Si el usuario ya existe Y se loguea (email/pass), devuelve session.
      
      /*
         NOTA: Supabase signUp devuelve user si el usuario se crea O si ya existe.
         Si ya existe y tiramos signUp, supabase puede devolver:
         1. Error "User already registered" (si confirm email está desactivado o config específica)
         2. Fake success (seguridad)
         3. Session si las credenciales coinciden implícitamente (raro en signUp, común en signIn)
      */

      if (!data.session) {
         // Si no hay sesión, verificamos si es porque requiere confirmación de email
         if (data.user && !data.session) {
             showDialog(
              "Por favor verifica tu correo electrónico para continuar",
              "email-check-outline",
            );
            setLoading(false);
            return;
         }
      }

      // Handle family group
      if (!familyCode) {
        // Create new family group
        try {
          console.log("Intentando crear grupo familiar...");
          const res = await postFamilyGroupCreate({
            name: displayName,
            ownerUserId: data.session!.user.id, // Force unwrap session
          });
          
          console.log("Family creation res:", res);

          if (!res) {
             console.warn("Respuesta vacía al crear familia");
          } else {
             // Si llegamos aquí, la petición HTTP fue exitosa.
             // Esperamos un poco y refrescamos.
             await new Promise((resolve) => setTimeout(resolve, 500));
             await refreshUserElepad(); 
          }
        } catch (err: unknown) {
          console.error("Error creating family group:", err);
          
          // Si hubo error, AUN ASÍ intentamos refrescar el usuario.
          try {
             await refreshUserElepad();
          } catch (refreshErr) {
             console.error("Error refreshing user after family failure:", refreshErr);
          }
        }
      } else {
        // Link to existing family group
        try {
           const sessionUser = data.session?.user;
           if (!sessionUser) throw new Error("No user in session");

          const res = await postFamilyGroupLink({
            invitationCode: familyCode,
            userId: sessionUser.id,
          });
          if (!res) {
            showDialog(
              "La cuenta se creó pero no se pudo vincular al grupo familiar. Verifica el código.",
            );
          } else {
            // Wait a bit for the database to update
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Refresh user data to get the new groupId
            await refreshUserElepad();
          }
        } catch (err: unknown) {
          console.error("Error linking to family group:", err);
           // Intentamos refrescar igual por si acaso
          await refreshUserElepad();
        }
      }
    } catch (err: unknown) {
      console.error("Signup Panic:", err);
      // Solo mostramos error si realmente falló todo catastróficamente
      if (!loading) return; // Si ya se hizo un refresh exitoso, no mostrar error
      
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear la cuenta";
      showDialog(getFriendlyErrorMessage(errorMessage));
      setLoading(false);
    }
    // Timeout de seguridad en caso de que todo se cuelgue
    setTimeout(() => { if(loading) setLoading(false); }, 15000);
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
          secureTextEntry={!showPassword}
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
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <TextInput
          mode="outlined"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
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
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? "eye-off" : "eye"}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />

        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          style={styles.primaryButton}
          buttonColor={COLORS.primary}
          onPress={handleSignUp}
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
