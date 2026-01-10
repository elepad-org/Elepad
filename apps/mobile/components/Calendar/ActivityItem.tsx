import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Card,
  List,
  IconButton,
  Portal,
  Dialog,
  Button,
  Divider,
} from "react-native-paper";
import { Activity, GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { COLORS } from "@/styles/base";
import HighlightedMentionText from "../Recuerdos/HighlightedMentionText";

interface ActivityItemProps {
  item: Activity;
  idUser: string;
  onEdit: (ev: Activity) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (ev: Activity) => void;
  isOwnerOfGroup: boolean;
  groupInfo?: GetFamilyGroupIdGroupMembers200;
  completed?: boolean; // Nueva prop para completado por día
  familyMembers?: Array<{ id: string; displayName: string; avatarUrl?: string | null }>;
  shouldOpen?: boolean;
  onOpened?: () => void;
}

export default function ActivityItem({
  item,
  idUser,
  onEdit,
  onDelete,
  onToggleComplete,
  isOwnerOfGroup,
  groupInfo,
  completed, // Usar esta prop en lugar de item.completed
  familyMembers = [],
  shouldOpen = false,
  onOpened,
}: ActivityItemProps) {
  const [showModal, setShowModal] = useState(false);

  // Abrir el modal automáticamente si shouldOpen es true
  useEffect(() => {
    if (shouldOpen && !showModal) {
      setShowModal(true);
      // Notificar que se abrió
      if (onOpened) {
        onOpened();
      }
    }
  }, [shouldOpen]);

  // Usar completed de la prop si está disponible, sino usar item.completed
  const isCompleted = completed !== undefined ? completed : item.completed;

  // Create a combined list of all group members (owner + members)
  const allGroupMembers = (() => {
    if (!groupInfo) return familyMembers;
    return [
      { id: groupInfo.owner.id, displayName: groupInfo.owner.displayName, avatarUrl: groupInfo.owner.avatarUrl },
      ...groupInfo.members.map(m => ({ id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl }))
    ];
  })();

  // Find the owner of this activity
  const activityOwner = (() => {
    const member = allGroupMembers.find((m) => m.id === item.createdBy);
    return member?.displayName || "Usuario desconocido";
  })();

  // Check if current user can edit this activity
  const canEdit = item.createdBy === idUser || isOwnerOfGroup;

  const timeDescription = (() => {
    const startDateObj = new Date(item.startsAt);
    const endDateObj = item.endsAt ? new Date(item.endsAt) : null;

    // Comparar fechas en hora local
    const startDateLocal = startDateObj.toLocaleDateString("en-CA"); // formato YYYY-MM-DD
    const endDateLocal = endDateObj?.toLocaleDateString("en-CA");
    const actualToday = new Date().toLocaleDateString("en-CA");

    const isActuallyToday = startDateLocal === actualToday;

    const startTime = startDateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Si la actividad no es de hoy (fecha actual), mostrar fecha completa de inicio
    const startDisplay = isActuallyToday
      ? startTime
      : `${startDateObj.toLocaleDateString([], {
          day: "numeric",
          month: "short",
        })} ${startTime}`;

    if (!endDateObj) return startDisplay;

    const endTime = endDateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (startDateLocal === endDateLocal) {
      // Mismo día local - solo mostrar hora de fin
      return `${startDisplay} - ${endTime}`;
    } else {
      // Diferente día - mostrar fecha completa de fin
      const endDateFormatted = endDateObj.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
      return `${startDisplay} - ${endDateFormatted} ${endTime}`;
    }
  })();

  const hasDescription = item.description && item.description.trim().length > 0;

  return (
    <Card 
      style={[
        styles.card, 
        isCompleted && styles.completedCard
      ]}
    >
      <List.Item
        style={styles.listItem}
        titleStyle={isCompleted && { textDecorationLine: "line-through" }}
        title={item.title}
        description={
          <View>
            <Text variant="bodySmall" style={styles.timeText}>
              {timeDescription}
            </Text>
          </View>
        }
        onPress={hasDescription ? () => setShowModal(true) : undefined}
        background={undefined}
        left={() => (
          <View style={styles.checkboxContainer}>
            <IconButton
              icon={isCompleted ? "checkbox-marked" : "checkbox-blank-outline"}
              iconColor={COLORS.primary}
              size={24}
              onPress={() => onToggleComplete(item)}
              style={{ margin: 0 }}
            />
          </View>
        )}
        right={() => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {canEdit && (
              <>
                <IconButton
                  icon="pencil-outline"
                  iconColor={COLORS.primary}
                  size={22}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  style={{ margin: 0 }}
                />
                <IconButton
                  icon="delete-outline"
                  iconColor={COLORS.primary}
                  size={22}
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  style={{ margin: 0 }}
                />
              </>
            )}
          </View>
        )}
      />

      {/* Modal de detalle */}
      <Portal>
        <Dialog
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          style={{
            backgroundColor: COLORS.background,
            borderRadius: 16,
            width: "90%",
            alignSelf: "center",
          }}
        >
          <Dialog.Title style={{ fontWeight: "bold", color: COLORS.text }}>
            {item.title}
          </Dialog.Title>
          <Dialog.Content>
            {/* Fecha y hora */}
            <View style={styles.modalRow}>
              <IconButton
                icon="clock-outline"
                size={20}
                iconColor={COLORS.primary}
                style={{ margin: 0 }}
              />
              <Text variant="bodyMedium" style={styles.modalText}>
                {timeDescription}
              </Text>
            </View>

            {/* Creador */}
            {activityOwner && (
              <View style={styles.modalRow}>
                <IconButton
                  icon="account"
                  size={20}
                  iconColor={COLORS.primary}
                  style={{ margin: 0 }}
                />
                <Text variant="bodyMedium" style={styles.modalText}>
                  Por: {activityOwner}
                </Text>
              </View>
            )}

            {/* Estado */}
            <View style={styles.modalRow}>
              <IconButton
                icon={
                  isCompleted
                    ? "checkbox-marked-circle"
                    : "checkbox-blank-circle-outline"
                }
                size={20}
                iconColor={isCompleted ? COLORS.primary : COLORS.textLight}
                style={{ margin: 0 }}
              />
              <Text variant="bodyMedium" style={styles.modalText}>
                {isCompleted ? "Completada" : "Pendiente"}
              </Text>
            </View>

            {/* Descripción */}
            {hasDescription && (
              <View>
                <Divider
                  style={{ marginVertical: 12, backgroundColor: COLORS.border }}
                />
                <Text
                  variant="labelMedium"
                  style={{
                    color: COLORS.primary,
                    marginBottom: 8,
                    fontWeight: "bold",
                  }}
                >
                  Descripción
                </Text>
                <HighlightedMentionText
                  text={item.description || ""}
                  familyMembers={allGroupMembers}
                  style={{ color: COLORS.text, lineHeight: 22, fontSize: 14 }}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <Button
              mode="contained"
              onPress={() => setShowModal(false)}
              buttonColor={COLORS.primary}
              style={{ borderRadius: 12, flex: 1 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              Cerrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    elevation: 0,
  },
  completedCard: {
    backgroundColor: COLORS.primary + "10",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  listItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  ownerText: {
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalText: {
    flex: 1,
    color: COLORS.textSecondary,
  },
});
