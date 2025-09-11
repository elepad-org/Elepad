import React from "react";
import { TouchableOpacity } from "react-native";
import { Dialog, Text, IconButton, Divider, Button } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import ImagePickerComponent from "./ImagePickerComponent";
import TextNoteComponent from "./TextNoteComponent";
import AudioRecorderComponent from "./AudioRecorderComponent";

type RecuerdoTipo = "imagen" | "texto" | "audio";

interface NuevoRecuerdoDialogProps {
  visible: boolean;
  hideDialog: () => void;
  onSelectTipo: (tipo: RecuerdoTipo) => void;
  step: "select" | "create";
  selectedTipo: RecuerdoTipo | null;
  onSave: (contenido: string, titulo?: string) => void;
  onCancel: () => void;
}

export default function NuevoRecuerdoDialogComponent({
  visible,
  hideDialog,
  onSelectTipo,
  step,
  selectedTipo,
  onSave,
  onCancel,
}: NuevoRecuerdoDialogProps) {
  if (step === "create" && selectedTipo) {
    return (
      <Dialog visible={visible} onDismiss={hideDialog}>
        {selectedTipo === "imagen" && (
          <ImagePickerComponent
            onImageSelected={(uri: string) => onSave(uri)}
            onCancel={onCancel}
          />
        )}
        {selectedTipo === "texto" && (
          <TextNoteComponent
            onSaveText={(titulo, contenido) => onSave(contenido, titulo)}
            onCancel={onCancel}
          />
        )}
        {selectedTipo === "audio" && (
          <AudioRecorderComponent
            onAudioRecorded={(uri: string) => onSave(uri)}
            onCancel={onCancel}
          />
        )}
      </Dialog>
    );
  }

  return (
    <Dialog visible={visible} onDismiss={hideDialog}>
      <Dialog.Title style={STYLES.heading}>Nuevo recuerdo</Dialog.Title>
      <Dialog.Content>
        <Text style={STYLES.subheading}>
          Selecciona el tipo de recuerdo que quieres subir:
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("imagen")}
        >
          <IconButton icon="image" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Imagen o Video</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("texto")}
        >
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Texto</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("audio")}
        >
          <IconButton icon="microphone" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Audio</Text>
        </TouchableOpacity>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={hideDialog}>Cancelar</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
