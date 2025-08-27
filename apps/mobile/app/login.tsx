import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button } from "react-native-paper";
import logoBlue from "@/assets/images/bbb.png";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    // Animación al presionar
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start();

    // placeholder: will be wired to real flow
    setTimeout(() => {
      console.log("Continue with:", email);
    }, 200);
  };

  const handleGoogle = () => {
    console.log("Google sign-in");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image source={logoBlue} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>ELEPAD</Text>
        </View>

        <View style={styles.separatorWrap}>
          <View style={styles.separator} />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create an account</Text>
          <Text style={styles.subheading}>
            Enter your email to sign up for this app
          </Text>

          <TextInput
            mode="outlined"
            placeholder="email@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineStyle={styles.inputOutline}
          />

          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              width: "100%",
            }}
          >
            <Button
              mode="contained"
              onPress={handleContinue}
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

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogle}
            activeOpacity={0.8}
          >
            <View style={styles.gIconWrap}>
              <Text style={styles.gIcon}>G</Text>
            </View>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Si tienes cuenta, haz click aqui</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF9F1" },
  container: { flex: 1, alignItems: "center" },
  logoWrap: { alignItems: "center" },
  logo: { width: 185, height: 185 },
  brand: {
    marginTop: 20,
    fontSize: 44,
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
  heading: {
    fontSize: 18,
    marginTop: 6,
    fontFamily: "Montserrat_600",
  },
  subheading: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Montserrat_600",
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
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#5278CD",
  },
  continueContent: { height: 48 },
  continueLabel: { fontSize: 16, fontFamily: "Montserrat_600" },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
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
  gIcon: { color: "#DB4437", fontFamily: "Montserrat_700" },
  googleText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "Montserrat_600",
  },
  footer: {
    marginTop: 18,
    color: "#B2AFAE",
    fontSize: 13,
    fontFamily: "Montserrat_600",
  },
});
