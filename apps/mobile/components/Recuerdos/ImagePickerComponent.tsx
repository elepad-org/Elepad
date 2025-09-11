import React, { useState } from "react";
import { View, Alert } from "react-native";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { STYLES, COLORS } from "@/styles/base";

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  onCancel: () => void;
}

export default function ImagePickerComponent({
  onImageSelected,
  onCancel,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos insuficientes",
        "Necesitamos permisos para acceder a tu galería.",
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
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
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
        "Necesitamos permisos para acceder a tu cámara.",
      );
      return;
    }

    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo tomar la foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={STYLES.contentContainer}>
      <Text style={STYLES.heading}>Agregar foto o video</Text>
      <Text style={STYLES.subheading}>
        Selecciona una imagen o video de tu galería o toma una nueva foto
      </Text>

      {uploading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={pickImage}
            style={STYLES.buttonPrimary}
            icon="image"
          >
            Seleccionar de galería
          </Button>
          <Button
            mode="contained"
            onPress={takePhoto}
            style={STYLES.buttonPrimary}
            icon="camera"
          >
            Tomar foto
          </Button>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={STYLES.buttonSecondary}
          >
            Cancelar
          </Button>
        </>
      )}
    </View>
  );
}
