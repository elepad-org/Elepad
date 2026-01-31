import { TouchableOpacity } from "react-native";
import { Dialog, Text, IconButton, Divider } from "react-native-paper";
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
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={{
          backgroundColor: COLORS.background,
          width: "90%",
          alignSelf: "center",
          borderRadius: 16,
        }}
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
      </Dialog>
    );
  }

  if (step === "create" && selectedTipo) {
    return (
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={{
          backgroundColor: COLORS.background,
          width: "90%",
          alignSelf: "center",
          borderRadius: 16,
        }}
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
      </Dialog>
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
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
          }}
          onPress={() => onSelectTipo("imagen")}
        >
          <IconButton icon="image" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Imagen o Video</Text>
        </TouchableOpacity>
        <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
          }}
          onPress={() => onSelectTipo("texto")}
        >
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Nota</Text>
        </TouchableOpacity>
        <Divider style={{ backgroundColor: COLORS.textPlaceholder }} />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
          }}
          onPress={() => onSelectTipo("audio")}
        >
          <IconButton icon="microphone" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Audio</Text>
        </TouchableOpacity>
      </Dialog.Content>
      <Dialog.Actions style={{ paddingBottom: 12, paddingHorizontal: 24, justifyContent: "center" }}>
        <CancelButton onPress={hideDialog} />
      </Dialog.Actions>
    </Dialog>
  );
}
