import React, { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  IconButton,
  Button,
  Card,
  Divider,
  List,
  Text,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";

const colors = {
  primary: "#7fb3d3",
  white: "#f9f9f9ff",
  background: "#F4F7FF",
};

export default function ConfigScreen() {
  const { userElepad } = useAuth();
  const displayName = userElepad?.displayName?.trim() || "Usuario";
  const email = userElepad?.email || "-";
  const avatarUrl = userElepad?.avatarUrl || "";
  const [name, setName] = useState(displayName);
  const [editOpen, setEditOpen] = useState(false);
  const [formName, setFormName] = useState(displayName);

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Appbar.Header
        mode="center-aligned"
        elevated
        style={{ backgroundColor: colors.primary }}
      >
        <Appbar.Content title="Perfil" color="#fff" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Avatar.Image size={112} source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Text size={112} label={getInitials(name)} />
            )}
            <IconButton
              icon="pencil"
              size={16}
              onPress={() => {
                setFormName(name);
                setEditOpen(true);
              }}
              iconColor="#fff"
              containerColor={colors.primary}
              style={styles.avatarBadge}
            />
          </View>
          <Text variant="titleLarge" style={styles.name}>
            {name}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {email}
          </Text>
        </View>

        <Card style={styles.menuCard} mode="elevated">
          <List.Section>
            <List.Item
              title="Editar perfil"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setFormName(name);
                setEditOpen(true);
              }}
            />
            <Divider />
            <List.Item
              title="Notificaciones"
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Grupo familiar"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Cambiar contraseña"
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </List.Section>
        </Card>

        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => {
              setFormName(name);
              setEditOpen(true);
            }}
            contentStyle={styles.bottomButtonContent}
            style={styles.bottomButton}
          >
            Editar perfil
          </Button>
        </View>
        <Portal>
          <Dialog visible={editOpen} onDismiss={() => setEditOpen(false)}>
            <Dialog.Title>Editar nombre</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nombre"
                mode="outlined"
                value={formName}
                onChangeText={setFormName}
                left={<TextInput.Icon icon="account" />}
                autoFocus
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setFormName(name);
                  setEditOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  const next = formName.trim();
                  if (next.length > 0) setName(next);
                  setEditOpen(false);
                }}
              >
                Guardar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
    justifyContent: "flex-start",
  },
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
  name: {
    textAlign: "center",
  },
  subtitle: {
    color: "#667085",
    textAlign: "center",
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
  },
  bottomButton: {
    borderRadius: 10,
  },
  bottomButtonContent: {
    height: 48,
  },
});
