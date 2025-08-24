import { supabase } from "@/lib/supabase";
import { View, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, Surface } from "react-native-paper";
import { makeRedirectUri } from "expo-auth-session";
import React, { useState, useRef } from "react";
import {
	Image,
	TouchableOpacity,
	Platform,
	Animated,
	Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logoBlue from "@/assets/images/bbb.png";


type Props = { onBack?: () => void };

export default function LogIn({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated value for button scale
  const buttonScale = useRef(new Animated.Value(1)).current;

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
    const redirectTo = makeRedirectUri({ scheme: "elepad" });
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
    <Surface style={styles.surface} elevation={2}>
      <View style={styles.containerPadding}>
        <Text style={styles.heading}>Iniciar Sesión</Text>
        <Text style={styles.subheading}>Ingresa tu email y tu contraseña</Text>

        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          style={styles.input}
          disabled={loading}
        />
        <TextInput
						mode="outlined"
						placeholder="email@domain.com"
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						autoCapitalize="none"
            returnKeyType="next"
						style={styles.input}
						outlineStyle={styles.inputOutline as any}
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
            onSubmitEditing={handleLogin}
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
						>
							Continue
						</Button>
					</Animated.View>


        <TextInput
          mode="outlined"
          label="Clave"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          style={styles.input}
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Entrar
        </Button>

        <Button
          mode="contained"
          onPress={handleGoogleLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Entrar con Google
        </Button>

        {onBack && (
          <Button
            mode="text"
            onPress={onBack}
            style={styles.backButton}
            labelStyle={styles.backLabel}
            disabled={loading}
          >
            Volver
          </Button>
        )}
      </View>
      <View style={styles.container}>
				

						<View style={styles.card}>
				
					<TextInput
						mode="outlined"
						placeholder="email@domain.com"
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						autoCapitalize="none"
						style={styles.input}
						outlineStyle={styles.inputOutline as any}
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
						>
							Continue
						</Button>
					</Animated.View>

					<View style={styles.orRow}>
						<View style={styles.line} />
						<Text style={styles.orText}>or</Text>
						<View style={styles.line} />
					</View>

					<TouchableOpacity style={styles.googleButton}  activeOpacity={0.8}>
						<View style={styles.gIconWrap}>
							<Text style={styles.gIcon}>G</Text>
						</View>
						<Text style={styles.googleText}>Continue with Google</Text>
					</TouchableOpacity>

					<Text style={styles.footer}>Si tienes cuenta, haz click aqui</Text>
				</View>
			</View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    marginTop: 200,
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
			fontFamily: "JosefinSans-Variable",
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
		width: "100%",
		borderRadius: 8,
		backgroundColor: "#5278CD",
	},
	continueContent: { height: 48 },
	continueLabel: { fontSize: 16, fontWeight: "600" },
	orRow: { width: "100%", flexDirection: "row", alignItems: "center", marginTop: 12 },
	line: { flex: 1, height: 1, backgroundColor: "#E6E3E0" },
	orText: { marginHorizontal: 12, color: "#999" },
	googleButton: {
		marginTop: 14,
		width: "100%",
		backgroundColor: "white",
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.15,
		shadowRadius: 6,
		elevation: 2,
	},
	gIconWrap: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
		borderWidth: 0.5,
		borderColor: "#E6E3E0",
	},
	gIcon: { fontWeight: "700", color: "#DB4437" },
		googleText: { fontSize: 15, color: "#333", fontFamily: "Montserrat", fontWeight: "600" },
		footer: { marginTop: 18, color: "#B2AFAE", fontSize: 13, fontFamily: "Montserrat", fontWeight: "600" },
});

