import React from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { COLORS, styles as baseStyles } from "@/styles/base";

export type ProfileHeaderProps = {
  name: string;
  email?: string;
  avatarUrl?: string;
  size?: number;
  onEditPhoto?: () => void;
};

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  avatarUrl,
  size = 112,
  onEditPhoto,
}) => {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Avatar.Image size={size} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Text size={size} label={getInitials(name)} />
        )}
        {onEditPhoto ? (
          <IconButton
            icon="pencil"
            size={15}
            onPress={onEditPhoto}
            iconColor="#fff"
            containerColor={COLORS.primary}
            style={styles.avatarBadge}
          />
        ) : null}
      </View>
      <Text variant="titleLarge" style={baseStyles.heading}>
        {name}
      </Text>
      {!!email && (
        <Text variant="bodyMedium" style={baseStyles.subheading}>
          {email}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default ProfileHeader;
