import { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text, Dialog, Button, Avatar, Portal } from "react-native-paper";
import { COLORS } from "@/styles/base";
import eleGrayImage from "@/assets/images/ele-gray.png";

interface Elder {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface ElderSelectorProps {
  elders: Elder[];
  selectedElderId: string | null;
  onSelectElder: (elderId: string) => void;
  label?: string;
}

export default function ElderSelector({
  elders,
  selectedElderId,
  onSelectElder,
  label = "Destinatario",
}: ElderSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);

  const selectedElder = elders.find((e) => e.id === selectedElderId);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowDialog(true)}
        style={styles.selectorButton}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.label}>{label}</Text>
          {selectedElder ? (
            <View style={styles.selectedElderRow}>
              <Avatar.Image
                size={32}
                source={
                  selectedElder.avatarUrl
                    ? { uri: selectedElder.avatarUrl }
                    : eleGrayImage
                }
                style={styles.avatar}
              />
              <Text style={styles.selectedElderName}>
                {selectedElder.displayName}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>Seleccionar adulto mayor</Text>
          )}
        </View>
      </TouchableOpacity>

      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => setShowDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Seleccionar destinatario
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.scrollView}>
              {elders.map((elder) => (
                <TouchableOpacity
                  key={elder.id}
                  onPress={() => {
                    onSelectElder(elder.id);
                    setShowDialog(false);
                  }}
                  style={[
                    styles.elderOption,
                    selectedElderId === elder.id && styles.elderOptionSelected,
                  ]}
                >
                  <Avatar.Image
                    size={40}
                    source={
                      elder.avatarUrl
                        ? { uri: elder.avatarUrl }
                        : eleGrayImage
                    }
                    style={styles.avatar}
                  />
                  <Text
                    style={[
                      styles.elderName,
                      selectedElderId === elder.id && styles.elderNameSelected,
                    ]}
                  >
                    {elder.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  selectorContent: {
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  selectedElderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placeholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  avatar: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  selectedElderName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  dialog: {
    backgroundColor: COLORS.background,
    width: "90%",
    alignSelf: "center",
    borderRadius: 20,
    elevation: 24,
    zIndex: 9999,
  },
  dialogTitle: {
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 20,
  },
  scrollView: {
    maxHeight: 400,
  },
  elderOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 12,
  },
  elderOptionSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  elderName: {
    fontSize: 16,
    color: COLORS.text,
  },
  elderNameSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
