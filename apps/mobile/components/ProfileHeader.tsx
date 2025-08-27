import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text, useTheme } from "react-native-paper";

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

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  size = 112,
  onEditPhoto,
}: ProfileHeaderProps) {
  const theme = useTheme();

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
            size={16}
            onPress={onEditPhoto}
            iconColor={theme.colors.onPrimary}
            containerColor={theme.colors.primary}
            style={[styles.avatarBadge, { borderColor: theme.colors.surface }]}
          />
        ) : null}
      </View>
      <Text variant="titleLarge" style={styles.name}>
        {name}
      </Text>
      {!!email && (
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
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
  },
  name: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
});

export default ProfileHeader;
