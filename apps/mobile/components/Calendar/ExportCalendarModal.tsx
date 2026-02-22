import { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Clipboard from "expo-clipboard";
import { COLORS } from "@/styles/base";
import {
  usePostCalendarGenerate,
  type GenerateCalendarResponse,
} from "@elepad/api-client";
import { useToast } from "@/components/shared/Toast";
import CancelButton from "@/components/shared/CancelButton";
import { format } from "date-fns";

function toDateString(date: Date): string {
  // Returns YYYY-MM-DD in local time
  return format(date, "yyyy-MM-dd");
}

function toDisplayDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

interface ExportCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export default function ExportCalendarModal({
  visible,
  onClose,
  userId,
}: ExportCalendarModalProps) {
  const { showToast } = useToast();

  // State for date pickers
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Result / error state
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const generateCalendarMutation = usePostCalendarGenerate({
    mutation: {
      onSuccess: (result) => {
        const response = result as unknown as GenerateCalendarResponse;
        setFeedUrl(response.feedUrl);
        setSuccessMessage(response.message);
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo generar el calendario. Inténtalo de nuevo.";
        setValidationError(message);
      },
    },
  });

  const isLoading = generateCalendarMutation.isPending;
  const mutationError = generateCalendarMutation.error;
  const errorMessage =
    validationError ??
    (mutationError instanceof Error ? mutationError.message : null);

  const handleClose = useCallback(() => {
    // Reset state on close
    setFeedUrl(null);
    setSuccessMessage(null);
    setValidationError(null);
    generateCalendarMutation.reset();
    onClose();
  }, [onClose, generateCalendarMutation]);

  const handleGenerate = useCallback(async () => {
    setValidationError(null);

    if (startDate > endDate) {
      setValidationError(
        "La fecha de inicio debe ser anterior o igual a la fecha de fin.",
      );
      return;
    }

    setFeedUrl(null);
    setSuccessMessage(null);
    generateCalendarMutation.mutate({
      data: {
        userId,
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
      },
    });
  }, [userId, startDate, endDate, generateCalendarMutation]);

  const handleCopyUrl = useCallback(async () => {
    if (!feedUrl) return;
    await Clipboard.setStringAsync(feedUrl);
    showToast({ message: "URL copiada al portapapeles", type: "success" });
  }, [feedUrl, showToast]);

  return (
    <>
      <Portal>
        <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Title style={styles.title}>
            Exportar a Google Calendar
          </Dialog.Title>

          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* ── Date selectors ── */}
              <Text style={styles.sectionLabel}>
                Selecciona el rango de fechas
              </Text>

              <View style={styles.dateRow}>
                {/* Start date */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Fecha inicio</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowStartPicker(true)}
                    style={styles.dateButton}
                    contentStyle={styles.dateButtonContent}
                    labelStyle={styles.dateButtonLabel}
                    disabled={isLoading}
                  >
                    {toDisplayDate(startDate)}
                  </Button>
                </View>

                {/* End date */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Fecha fin</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowEndPicker(true)}
                    style={styles.dateButton}
                    contentStyle={styles.dateButtonContent}
                    labelStyle={styles.dateButtonLabel}
                    disabled={isLoading}
                  >
                    {toDisplayDate(endDate)}
                  </Button>
                </View>
              </View>

              {/* ── Error message ── */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* ── Loading indicator ── */}
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>Generando archivo...</Text>
                </View>
              ) : null}

              {/* ── Result section ── */}
              {feedUrl ? (
                <View style={styles.resultBox}>
                  <Text style={styles.successMessage}>{successMessage}</Text>

                  <Text style={styles.resultLabel}>URL de tu calendario:</Text>
                  <TextInput
                    value={feedUrl}
                    multiline
                    editable={false}
                    mode="outlined"
                    style={styles.urlInput}
                    outlineColor={COLORS.primary}
                    activeOutlineColor={COLORS.primary}
                    dense
                  />

                  <Text style={styles.hint}>
                    Copia esta URL y pégala en la sección{" "}
                    <Text style={styles.hintBold}>Desde URL</Text> de tu
                    Google Calendar para sincronizar tus actividades.
                  </Text>

                  <Button
                    mode="contained"
                    icon="content-copy"
                    onPress={handleCopyUrl}
                    buttonColor={COLORS.primary}
                    textColor={COLORS.white}
                    style={styles.copyButton}
                  >
                    Copiar URL
                  </Button>
                </View>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions style={styles.actions}>
            <CancelButton onPress={handleClose} />
            {!feedUrl ? (
              <Button
                mode="contained"
                onPress={handleGenerate}
                buttonColor={COLORS.primary}
                textColor={COLORS.white}
                style={styles.confirmButton}
                loading={isLoading}
                disabled={isLoading}
              >
                Confirmar exportación
              </Button>
            ) : null}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* ── Date pickers ── */}
      <DateTimePickerModal
        isVisible={showStartPicker}
        mode="date"
        date={startDate}
        maximumDate={endDate}
        onConfirm={(date) => {
          setShowStartPicker(false);
          setStartDate(date);
        }}
        onCancel={() => setShowStartPicker(false)}
        locale={Platform.OS === "ios" ? "es_ES" : "es"}
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />

      <DateTimePickerModal
        isVisible={showEndPicker}
        mode="date"
        date={endDate}
        minimumDate={startDate}
        onConfirm={(date) => {
          setShowEndPicker(false);
          setEndDate(date);
        }}
        onCancel={() => setShowEndPicker(false)}
        locale={Platform.OS === "ios" ? "es_ES" : "es"}
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />
    </>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: COLORS.background,
    width: "92%",
    alignSelf: "center",
    borderRadius: 20,
    maxHeight: "90%",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  scrollArea: {
    paddingHorizontal: 0,
    borderColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateButton: {
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  dateButtonContent: {
    height: 44,
  },
  dateButtonLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  errorBox: {
    backgroundColor: "#fde8e8",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: "#c0392b",
    fontSize: 13,
    lineHeight: 18,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resultBox: {
    gap: 10,
  },
  successMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  urlInput: {
    fontSize: 12,
    backgroundColor: COLORS.backgroundSecondary,
    minHeight: 60,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  hintBold: {
    fontWeight: "700",
    color: COLORS.text,
  },
  copyButton: {
    borderRadius: 12,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    flexDirection: "column",
  },
  confirmButton: {
    borderRadius: 12,
    width: "100%",
  },
});
