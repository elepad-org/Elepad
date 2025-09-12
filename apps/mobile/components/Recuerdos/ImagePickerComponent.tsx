import React, { useState } from "react";
import { View, Alert } from "react-native";
import { Button, Text, ActivityIndicator } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

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
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
        console.log(result.assets[0].uri);
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
        mediaTypes: ["images", "videos"],
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
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
      }}
    >
      <Text style={STYLES.heading}>Agregar foto o video</Text>
      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        Selecciona una imagen o video de tu galería o toma una nueva foto:
      </Text>

      {uploading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginVertical: 20 }}
        />
      ) : (
        <>
          <Button
            mode="contained"
            onPress={pickImage}
            style={{ ...STYLES.buttonPrimary, marginBottom: 12 }}
            icon="image"
          >
            Seleccionar de galería
          </Button>
          <Button
            mode="contained"
            onPress={takePhoto}
            style={{ ...STYLES.buttonPrimary, marginBottom: 20 }}
            icon="camera"
          >
            Tomar foto
          </Button>
          <CancelButton onPress={onCancel} />
        </>
      )}
    </View>
  );
}
