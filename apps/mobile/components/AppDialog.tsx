import { Portal, Dialog, Button, Text } from "react-native-paper";
import { COLORS, STYLES } from "@/styles/base";

interface AppDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function AppDialog({
  visible,
  onClose,
  title,
  message,
}: AppDialogProps) {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={{
          backgroundColor: COLORS.background,
          width: "90%",
          alignSelf: "center",
          borderRadius: 16,
          paddingVertical: 14,
        }}
      >
        <Dialog.Title
          style={{ ...STYLES.heading, paddingTop: 8, marginBottom: 0 }}
        >
          {title}
        </Dialog.Title>
        <Dialog.Content style={{ paddingBottom: 8, paddingTop: 4 }}>
          <Text
            style={{ ...STYLES.subheading, marginTop: 0, marginBottom: 12 }}
          >
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions
          style={{
            paddingBottom: 12,
            paddingRight: 20,
            justifyContent: "flex-end",
          }}
        >
          <Button
            onPress={onClose}
            mode="contained"
            buttonColor={COLORS.primary}
            textColor="#fff"
            style={{ borderRadius: 20, paddingHorizontal: 24 }}
          >
            Aceptar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
