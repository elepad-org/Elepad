import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";

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

export const ProfileHeader = ({
  name,
  email,
  avatarUrl,
  size = 112,
  onEditPhoto,
}: ProfileHeaderProps) => {
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
            icon="camera"
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
