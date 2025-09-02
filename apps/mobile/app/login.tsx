import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button } from "react-native-paper";
import logoBlue from "@/assets/images/bbb.png";
import { COLORS, commonStyles } from "@/styles/shared";

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

          <Text style={styles.footerText}>
            Si tienes cuenta, haz click aqui
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Using common styles from shared.ts
  ...commonStyles,

  // Specific styles or overrides for this screen
  safe: { flex: 1, backgroundColor: COLORS.loginBackground },
  container: { flex: 1, alignItems: "center" },
  card: {
    ...commonStyles.loginCard,
  },
  continueButton: {
    ...commonStyles.continueButton,
  },
  footerText: {
    ...commonStyles.footerText,
  },
});
