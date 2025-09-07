import React, { useState, useRef } from "react";
import { View, Image, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Button } from "react-native-paper";
import logoBlue from "@/assets/images/bbb.png";
import { styles as baseStyles } from "@/styles/base";

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
    <SafeAreaView
      style={baseStyles.safeAreaLogin}
      edges={["top", "left", "right"]}
    >
      <View style={baseStyles.container}>
        <View style={baseStyles.logoWrap}>
          <Image
            source={logoBlue}
            style={baseStyles.logo}
            resizeMode="contain"
          />
          <Text style={baseStyles.brand}>ELEPAD</Text>
        </View>

        <View style={baseStyles.separatorWrap}>
          <View style={baseStyles.separator} />
        </View>

        <View style={baseStyles.card}>
          <Text style={baseStyles.heading}>Create an account</Text>
          <Text style={baseStyles.subheading}>
            Enter your email to sign up for this app
          </Text>

          <TextInput
            mode="outlined"
            placeholder="email@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={baseStyles.input}
            outlineStyle={baseStyles.inputOutline}
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
              contentStyle={baseStyles.buttonContent}
              style={baseStyles.buttonPrimary}
              labelStyle={baseStyles.buttonContent}
            >
              Continue
            </Button>
          </Animated.View>

          <View style={baseStyles.orRow}>
            <View style={baseStyles.orLine} />
            <Text style={baseStyles.orText}>or</Text>
            <View style={baseStyles.orLine} />
          </View>

          <TouchableOpacity
            style={baseStyles.buttonGoogle}
            onPress={handleGoogle}
            activeOpacity={0.8}
          >
            <View style={baseStyles.googleIconWrap}>
              <Text style={baseStyles.googleIcon}>G</Text>
            </View>
            <Text style={baseStyles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={baseStyles.footerText}>
            Si tienes cuenta, haz click aqui
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
