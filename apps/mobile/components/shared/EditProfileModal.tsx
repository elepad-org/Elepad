import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Modal, Text, Divider, IconButton } from "react-native-paper";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import ProfileHeader from "@/components/ProfileHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface EditProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
  displayName: string;
  avatarUrl?: string;
  activeFrameUrl?: string | null;
  equippedFrameName?: string | null;
  onEditPhotoPress: () => void;
  onChangeFramePress: () => void;
  onEditNamePress: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onDismiss,
  displayName,
  avatarUrl,
  activeFrameUrl,
  equippedFrameName,
  onEditPhotoPress,
  onChangeFramePress,
  onEditNamePress,
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContent}
    >
      <View style={styles.header}>
        <Text style={STYLES.heading}>Editar Perfil</Text>
        <IconButton icon="close" onPress={onDismiss} style={styles.closeBtn} />
      </View>

      <View style={styles.profileSection}>
        <ProfileHeader
          name={displayName}
          avatarUrl={avatarUrl}
          frameUrl={activeFrameUrl || undefined}
          size={140}
        />
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionRow} onPress={onEditPhotoPress}>
          <MaterialCommunityIcons name="image" size={24} color={COLORS.primary} style={styles.optionIcon} />
          <Text style={styles.optionText}>Cambiar Foto de Perfil</Text>
        </TouchableOpacity>

        <Divider style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={onChangeFramePress}>
          <MaterialCommunityIcons name="image-frame" size={24} color={COLORS.primary} style={styles.optionIcon} />
          <View style={styles.nameContainer}>
            <Text style={styles.optionText}>Cambiar Marco</Text>
            {equippedFrameName && (
              <Text style={styles.currentNameText}>{equippedFrameName}</Text>
            )}
          </View>
        </TouchableOpacity>

        <Divider style={styles.divider} />

        <TouchableOpacity style={styles.optionRow} onPress={onEditNamePress}>
          <MaterialCommunityIcons name="account-edit" size={24} color={COLORS.primary} style={styles.optionIcon} />
          <View style={styles.nameContainer}>
            <Text style={styles.optionText}>Nombre</Text>
            <Text style={styles.currentNameText}>{displayName}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: COLORS.white,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    right: -10,
    top: -10,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  optionsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: STYLES.heading.fontFamily,
  },
  nameContainer: {
    flex: 1,
  },
  currentNameText: {
    fontSize: 14,
    color: COLORS.textPlaceholder,
    marginTop: 2,
  },
  divider: {
    backgroundColor: COLORS.border,
    height: 1,
  },
});
