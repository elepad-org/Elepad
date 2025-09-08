import { supabase } from "@/lib/supabase";
import { postFamilyGroupCreate, postFamilyGroupLink } from "@elepad/api-client";
import { Link } from "expo-router";
import { useState } from "react";
import { View, Alert } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { COLORS, styles as baseStyles } from "@/styles/base";

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
          baseStyles.titleCard,
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
        <Text style={baseStyles.heading}>Crear Cuenta</Text>
        <Text style={[baseStyles.subheading, { marginTop: 8 }]}>
          Ingrese sus datos personales
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Nombre de usuario"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
          returnKeyType="next"
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
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
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
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
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
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
          style={baseStyles.input}
          outlineStyle={baseStyles.inputOutline}
          onSubmitEditing={handleSignUp}
          disabled={loading}
          dense
        />

        <Button
          mode="contained"
          contentStyle={baseStyles.buttonContent}
          style={baseStyles.buttonPrimary}
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
        >
          Continuar
        </Button>

        <View style={baseStyles.orRow}>
          <View style={baseStyles.orLine} />
          <Text style={baseStyles.orText}>o</Text>
          <View style={baseStyles.orLine} />
        </View>

        <Link
          href={{ pathname: "/" }}
          accessibilityRole="button"
          style={[
            baseStyles.subheading,
            { textAlign: "center", marginTop: 23 },
          ]}
        >
          <Text style={[baseStyles.subheading]}> Volver</Text>
        </Link>
      </View>
    </View>
  );
}
