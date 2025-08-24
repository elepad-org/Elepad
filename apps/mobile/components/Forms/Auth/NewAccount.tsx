import { supabase } from "@/lib/supabase";
import { AuthError } from "@supabase/supabase-js";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import {
  Surface,
  TextInput,
  Button,
  Text,
  Portal,
  Dialog,
  ActivityIndicator,
} from "react-native-paper";

type Props = { onBack?: () => void };

export default function NewAccount({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Login state
  const [loginLoading, setLoginLoading] = useState(false);

  // Function to get modal error message based on status code (could be more, just saw these)
  const getErrorMessage = (error: AuthError) => {
    if (error.code === "weak_password")
      return "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
    if (error.code === "validation_failed")
      return "El correo electrónico no es válido.";
    if (error.code === "email_exists")
      return "Este correo ya está asociado a una cuenta.";
    if (error.code === "email_address_invalid")
      return "La dirección de correo no es válida.";
    if (error.code === "password_hash_invalid")
      return "La contraseña no es válida.";
    if (error.code === "anonymous_provider_disabled") return "Revise sus datos";
    return (
      error.message ||
      "Ocurrió un error inesperado. Intente nuevamente por favor."
    ); // This is for status 500 (supabase gets lazy)
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { displayName, passwordHash: password } },
    });
    if (error) {
      console.log(error);
      setModalMessage(getErrorMessage(error));
      setIsError(true);
    } else {
      setModalMessage(
        "Ya creamos tu cuenta. Revisa tu correo para confirmar que te pertenece.\n Luego puedes hacer clic en este boton."
      );
      setIsError(false);
    }
    setModalVisible(true);
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setModalMessage(
        "⚠️ Error al iniciar sesión.\n Verifica que hayas confirmado tu correo, luego intenta nuevamente."
      );
      setIsError(true);
      setLoginLoading(false);

      // TODO: Could be nice if on error, the modal redirects to LogIn view

      return;
    }

    setModalVisible(false);
    setLoginLoading(false);

    // TODO: Add a navigate or redirect to HomePage
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
						outlineStyle={styles.inputOutline as any}
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
						outlineStyle={styles.inputOutline as any}
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
						outlineStyle={styles.inputOutline as any}
            onSubmitEditing={handleSignUp}
            disabled={loading}
            dense  
					/>
          <Animated.View style={{
						transform: [{ scale: buttonScale }],
						width: '100%',
					}}>
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
				>
          <Text style={styles.inlineBack}>Volver</Text>
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
    backgroundColor: "#FFF9F1"
  },
  containerPadding: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontFamily: 'Montserrat',
    fontWeight: '600',
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
    fontFamily: 'Montserrat',
  },
  safe: { flex: 1, backgroundColor: "#FFF9F1" },
		container: { flex: 1, alignItems: "center" },
		logoWrap: { alignItems: "center"},
		logo: { width: 185, height: 185 },
		brand: {
			marginTop: 20,
			fontSize: 44,
			fontWeight: "400",
			letterSpacing: 8,
			fontFamily: "Montserrat",
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
		heading: { fontSize: 22, fontWeight: "600", marginTop: 6, fontFamily: "Montserrat", textAlign: "center" },
		subheading: { fontSize: 13, color: "#666", marginTop: 8, textAlign: "center", fontFamily: "Montserrat", fontWeight: "600" },
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
	continueLabel: { fontSize: 16, fontWeight: "600" },
	orRow: { width: "100%", flexDirection: "row", alignItems: "center", marginTop: 12,marginBottom: 14 },
	line: { flex: 1, height: 1, backgroundColor: "#E6E3E0" },
	orText: { marginHorizontal: 12, color: "#999" },
  inlineBack: {
		marginTop: 22,
		textAlign: 'center',
		fontFamily: 'Montserrat',
		fontSize: 14,
		color: '#666',
	},
});
