import { View, Text, Modal, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface ReAuthModalProps {
  visible: boolean;
  onDismiss: () => void;
  onReAuth: () => void;
}

export default function ReAuthModal({
  visible,
  onDismiss,
  onReAuth,
}: ReAuthModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Google Calendar Authentication</Text>
          <Text style={styles.message}>
            Your Google Calendar session has expired. Please sign in again to
            continue using calendar sync.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={onReAuth}
              style={styles.button}
              buttonColor={COLORS.primary}
            >
              Sign In Again
            </Button>

            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
              textColor={COLORS.primary}
            >
              Cancel
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    width: "100%",
  },
});
