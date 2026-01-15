import { View, StyleSheet } from "react-native";
import { Portal, Dialog, Text, ActivityIndicator } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface AlbumProcessingDialogProps {
  visible: boolean;
  albumTitle: string;
}

export default function AlbumProcessingDialog({
  visible,
  albumTitle,
}: AlbumProcessingDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} dismissable={false} style={styles.dialog}>
        <Dialog.Content style={styles.content}>
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Creando tu álbum</Text>

          <Text style={styles.description}>
            {albumTitle} se está procesando en segundo plano.
          </Text>

          <Text style={styles.subtitle}>
            Estamos generando narrativas únicas para cada foto usando
            inteligencia artificial.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Te enviaremos una notificación cuando tu álbum esté listo
            </Text>
          </View>

          <Text style={styles.footerText}>
            Puedes continuar usando la app mientras tanto
          </Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  content: {
    alignItems: "center",
    paddingVertical: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
