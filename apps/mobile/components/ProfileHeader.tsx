import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";

export type ProfileHeaderProps = {
  name: string;
  email?: string;
  avatarUrl?: string;
  size?: number;
  onEditPhoto?: () => void;
  frameUrl?: string; // New prop for the frame
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

import { Image } from "react-native"; // Make sure to import Image

export const ProfileHeader = ({
  name,
  email,
  avatarUrl,
  size = 112,
  onEditPhoto,
  frameUrl,
}: ProfileHeaderProps) => {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarWrapper}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            <Avatar.Image size={size} source={{ uri: avatarUrl }} />
          ) : (
            <Avatar.Text size={size} label={getInitials(name)} />
          )}
        </View>

        {/* Frame Overlay */}
        {frameUrl && (
          <Image
            source={{ uri: frameUrl }}
            style={{
              position: "absolute",
              width: size * 1.4, // Frames are usually slightly larger than the avatar
              height: size * 1.4,
              top: -size * 0.2,
              left: -size * 0.2,
              zIndex: 10,
            }}
            resizeMode="contain"
          />
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
      <Text variant="titleLarge" style={STYLES.heading}>
        {name}
      </Text>
      {!!email && (
        <Text variant="bodyMedium" style={STYLES.subheading}>
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
