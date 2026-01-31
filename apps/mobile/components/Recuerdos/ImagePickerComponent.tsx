import { useState } from "react";
import { View, Alert } from "react-native";
import { Button, Text, ActivityIndicator, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

interface ImagePickerProps {
  onImageSelected: (uri: string, mimeType?: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function ImagePickerComponent({
  onImageSelected,
  onCancel,
  isUploading = false,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos insuficientes",
        "Necesitamos permisos para acceder a tu galería."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
        videoMaxDuration: 300, // 5 minutos máximo
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Asegurar que el mimeType sea correcto
        let mimeType = asset.mimeType;
        if (!mimeType) {
          // Inferir mimeType basado en el tipo de asset
          if (asset.type === "video") {
            mimeType = "video/mp4";
          } else if (asset.type === "image") {
            mimeType = "image/jpeg";
          }
        }
        onImageSelected(asset.uri, mimeType);
      }
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos insuficientes",
        "Necesitamos permisos para acceder a tu cámara."
      );
      return;
    }

    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutos máximo
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Asegurar que el mimeType sea correcto
        let mimeType = asset.mimeType;
        if (!mimeType) {
          // Inferir mimeType basado en el tipo de asset
          if (asset.type === "video") {
            mimeType = "video/mp4";
          } else if (asset.type === "image") {
            mimeType = "image/jpeg";
          }
        }
        onImageSelected(asset.uri, mimeType);
      }
    } catch {
      Alert.alert("Error", "No se pudo tomar la foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
        borderRadius: 20,
      }}
    >
      <Text style={STYLES.heading}>Agregar foto o video</Text>
      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        Selecciona una imagen o video de tu galería o toma una nueva foto
      </Text>

      {uploading || isUploading ? (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={STYLES.subheading}>
            {uploading ? "Seleccionando archivo..." : "Subiendo recuerdo..."}
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <Button
              mode="contained"
              onPress={pickImage}
              style={{
                ...STYLES.buttonPrimary,
                flex: 1,
                aspectRatio: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 30,
              }}
              contentStyle={{ height: 90 }}
              disabled={isUploading}
            >
              <View style={{ alignItems: 'center' }}>
                <Icon source="image" size={28} color="white" />
                <Text style={{ fontSize: 12, textAlign: 'center', color: 'white', marginTop: 4 }}>
                  Seleccionar imagen
                </Text>
              </View>
            </Button>
            <Button
              mode="contained"
              onPress={takePhoto}
              style={{
                ...STYLES.buttonPrimary,
                flex: 1,
                aspectRatio: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 8,
                borderRadius: 30,
              }}
              contentStyle={{ height: 90 }}
              disabled={isUploading}
            >
              <View style={{ alignItems: 'center' }}>
                <Icon source="camera" size={28} color="white" />
                <Text style={{ fontSize: 12, textAlign: 'center', color: 'white', marginTop: 4 }}>
                  Tomar foto
                </Text>
              </View>
            </Button>
          </View>
          <CancelButton
            onPress={onCancel}
            disabled={isUploading}
          />
        </View>
      )}
    </View>
  );
}
