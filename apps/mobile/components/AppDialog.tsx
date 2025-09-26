import { Portal, Dialog, Button, Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

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
          backgroundColor: "#fff",
          marginTop: "-15%",
          borderRadius: 16,
        }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyLarge">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onClose}
            mode="contained"
            buttonColor={COLORS.secondary}
            textColor="#ffffffff"
            style={{ borderRadius: 10 }}
          >
            Aceptar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
