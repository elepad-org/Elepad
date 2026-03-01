import {
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Dialog, Text, Divider, Icon, Portal } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import ImagePickerComponent from "./ImagePickerComponent";
import TextNoteComponent from "./TextNoteComponent";
import AudioRecorderComponent from "./AudioRecorderComponent";
import MetadataInputComponent from "./MetadataInputComponent";
import CancelButton from "../shared/CancelButton";

type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface FamilyMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  activeFrameUrl?: string | null;
}

interface RecuerdoData {
  contenido: string; // URI del archivo o texto
  titulo?: string;
  caption?: string;
  mimeType?: string;
}

interface NuevoRecuerdoDialogProps {
  visible: boolean;
  hideDialog: () => void;
  onSelectTipo: (tipo: RecuerdoTipo) => void;
  step: "select" | "create" | "metadata";
  selectedTipo: RecuerdoTipo | null;
  onSave: (data: RecuerdoData) => void;
  onCancel: () => void;
  isUploading?: boolean;
  selectedFileUri?: string;
  selectedFileMimeType?: string;
  onFileSelected?: (uri: string, mimeType?: string) => void;
  familyMembers?: FamilyMember[];
  currentUserId?: string;
}

export default function NuevoRecuerdoDialogComponent({
  visible,
  hideDialog,
  onSelectTipo,
  step,
  selectedTipo,
  onSave,
  onCancel,
  isUploading = false,
  selectedFileUri,
  selectedFileMimeType,
  onFileSelected,
  familyMembers = [],
  currentUserId,
}: NuevoRecuerdoDialogProps) {
  // Paso de metadata para imágenes, videos y audio
  if (
    step === "metadata" &&
    selectedTipo &&
    selectedFileUri &&
    onFileSelected
  ) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onCancel}
      >
        <Portal.Host>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={onCancel}
            />
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.modalContent}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
            
              <MetadataInputComponent
                onSave={(title, caption) => {
                  // Usar el mimeType que se recibió del archivo seleccionado
                  onSave({
                    contenido: selectedFileUri,
                    titulo: title,
                    caption: caption,
                    mimeType: selectedFileMimeType,
                  });
                }}
                onCancel={onCancel}
                isUploading={isUploading}
                familyMembers={familyMembers}
                currentUserId={currentUserId}
                
              />
              
            </KeyboardAvoidingView>
          </View>
        </Portal.Host>
      </Modal>
    );
  }

  if (step === "create" && selectedTipo) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onCancel}
      >
        <Portal.Host>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={onCancel}
            />
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.modalContent}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              {selectedTipo === "imagen" && (
                <ImagePickerComponent
                  onImageSelected={(uri: string, mimeType?: string) => {
                    if (onFileSelected) {
                      onFileSelected(uri, mimeType);
                    } else {
                      onSave({ contenido: uri, mimeType });
                    }
                  }}
                  onCancel={onCancel}
                  isUploading={isUploading}
                />
              )}
              {selectedTipo === "texto" && (
                <TextNoteComponent
                  onSaveText={(titulo, contenido) =>
                    onSave({ contenido, titulo, caption: contenido })
                  }
                  onCancel={onCancel}
                  isUploading={isUploading}
                  familyMembers={familyMembers}
                  currentUserId={currentUserId}
                />
              )}
              {selectedTipo === "audio" && (
                <AudioRecorderComponent
                  onAudioRecorded={(uri: string) => {
                    if (onFileSelected) {
                      onFileSelected(uri, "audio/m4a");
                    } else {
                      onSave({ contenido: uri, mimeType: "audio/m4a" });
                    }
                  }}
                  onCancel={onCancel}
                  isUploading={isUploading}
                />
              )}
            </KeyboardAvoidingView>
          </View>
        </Portal.Host>
      </Modal>
    );
  }

  return (
    <Dialog
      visible={visible}
      onDismiss={hideDialog}
      style={{
        backgroundColor: COLORS.background,
        width: "90%",
        alignSelf: "center",
        paddingVertical: 14,
        borderRadius: 16,
      }}
    >
      <Dialog.Title style={STYLES.heading}>Nuevo recuerdo</Dialog.Title>
      <Dialog.Content style={{ paddingBottom: 8 }}>
        <Text style={{ ...STYLES.subheading, marginBottom: 14 }}>
          Selecciona el tipo de recuerdo que quieres subir
        </Text>
        <Pressable
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: pressed
              ? COLORS.backgroundSecondary
              : "transparent",
            opacity: pressed ? 0.8 : 1,
            marginBottom: 4,
          })}
          onPress={() => onSelectTipo("imagen")}
        >
          <View style={{ marginRight: 12 }}>
            <Icon source="image" size={24} color={COLORS.primary} />
          </View>
          <Text style={STYLES.paragraphText}>Imagen o Video</Text>
        </Pressable>

        <Divider
          style={{ backgroundColor: COLORS.textPlaceholder, opacity: 0.2 }}
        />

        <Pressable
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: pressed
              ? COLORS.backgroundSecondary
              : "transparent",
            opacity: pressed ? 0.8 : 1,
            marginVertical: 4,
          })}
          onPress={() => onSelectTipo("texto")}
        >
          <View style={{ marginRight: 12 }}>
            <Icon source="text" size={24} color={COLORS.primary} />
          </View>
          <Text style={STYLES.paragraphText}>Nota</Text>
        </Pressable>

        <Divider
          style={{ backgroundColor: COLORS.textPlaceholder, opacity: 0.2 }}
        />

        <Pressable
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: pressed
              ? COLORS.backgroundSecondary
              : "transparent",
            opacity: pressed ? 0.8 : 1,
            marginTop: 4,
          })}
          onPress={() => onSelectTipo("audio")}
        >
          <View style={{ marginRight: 12 }}>
            <Icon source="microphone" size={24} color={COLORS.primary} />
          </View>
          <Text style={STYLES.paragraphText}>Audio</Text>
        </Pressable>
      </Dialog.Content>
      <Dialog.Actions
        style={{
          paddingBottom: 12,
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
      >
        <CancelButton onPress={hideDialog} />
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    zIndex: 1,
    maxHeight: "90%",
  },
});
