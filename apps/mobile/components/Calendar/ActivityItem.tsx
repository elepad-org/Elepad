import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import {
  Text,
  IconButton,
  Portal,
  Dialog,
  Button,
  Divider,
} from "react-native-paper";
import { Activity, GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { COLORS, SHADOWS } from "@/styles/base";
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
  familyMembers?: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
  shouldOpen?: boolean;
  onOpened?: () => void;
  showTargetUser?: boolean;
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
  showTargetUser = true,
}: ActivityItemProps) {
  const [showModal, setShowModal] = useState(false);

  // Abrir el modal automáticamente si shouldOpen es true
  useEffect(() => {
    if (shouldOpen && !showModal) {
      console.log("📱 ActivityItem: Opening modal for activity", item.id);
      // Pequeño delay para asegurar que el componente esté completamente renderizado
      setTimeout(() => {
        setShowModal(true);
        // Notificar que se abrió
        if (onOpened) {
          onOpened();
        }
      }, 300);
    }
  }, [shouldOpen, showModal]);

  // Usar completed de la prop si está disponible, sino usar item.completed
  const isCompleted = completed !== undefined ? completed : item.completed;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showModal) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showModal]);

  // Create a combined list of all group members (owner + members)
  const allGroupMembers = (() => {
    if (!groupInfo) return familyMembers;
    return [
      {
        id: groupInfo.owner.id,
        displayName: groupInfo.owner.displayName,
        avatarUrl: groupInfo.owner.avatarUrl,
      },
      ...groupInfo.members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
      })),
    ];
  })();

  // Find the owner of this activity
  const activityOwner = (() => {
    const member = allGroupMembers.find((m) => m.id === item.createdBy);
    return member?.displayName || "Usuario desconocido";
  })();

  // Find the assigned user (recipient) of this activity
  const activityAssignedTo = (() => {
    if (!item.assignedTo) return null;
    const member = allGroupMembers.find((m) => m.id === item.assignedTo);
    return member?.displayName || "Usuario desconocido";
  })();

  // Check if current user can edit this activity
  const canEdit = item.createdBy === idUser || isOwnerOfGroup;

  const getFormatTime = () => {
    const date = new Date(item.startsAt);
    return date.toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

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
      hour12: true,
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
      hour12: true,
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
    <>
      <Pressable
        style={({ pressed }) => [
          styles.cardWrapper,
          isCompleted && styles.cardWrapperCompleted,
          styles.pressableArea,
          pressed && {
            transform: [{ scale: 0.98 }],
          },
        ]}
        onPress={() => setShowModal(true)}
      >
        {/* Accent Border Left - Only show if completed */}
        {isCompleted && <View style={styles.accentBorder} />}

        {/* Checkbox Icon (Left) */}
        <IconButton
          icon={isCompleted ? "checkbox-marked" : "checkbox-blank-outline"}
          iconColor={isCompleted ? COLORS.primary : COLORS.primary}
          size={24}
          onPress={(e) => {
            e.stopPropagation();
            onToggleComplete(item);
          }}
          style={styles.actionButtonLeft}
        />

        <View style={styles.contentContainer}>
          <Text
            style={[styles.title, isCompleted && styles.completedText]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {hasDescription && (
            <HighlightedMentionText
              text={item.description || ""}
              familyMembers={allGroupMembers}
              style={styles.description}
              numberOfLines={1}
            />
          )}

          {/* Footer con información de hora y asignación */}
          <View style={styles.assignedToContainer}>
            <Text style={styles.assignedToText}>
              {showTargetUser && activityAssignedTo
                ? `Para: ${activityAssignedTo}   ${getFormatTime()}`
                : getFormatTime()}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {canEdit && (
            <>
              <IconButton
                icon="pencil-outline"
                iconColor={COLORS.primary}
                size={20}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete-outline"
                iconColor={COLORS.primary}
                size={20}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </Pressable>

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
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>{item.title}</Text>
            </View>

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

              {/* Creador y Destinatario */}
              {item.createdBy !== item.assignedTo && activityOwner && (
                <View style={styles.modalRow}>
                  <IconButton
                    icon="account-edit"
                    size={20}
                    iconColor={COLORS.primary}
                    style={{ margin: 0 }}
                  />
                  <Text variant="bodyMedium" style={styles.modalText}>
                    Creado por: {activityOwner}
                  </Text>
                </View>
              )}

              {activityAssignedTo && (
                <View style={styles.modalRow}>
                  <IconButton
                    icon="account-arrow-right"
                    size={20}
                    iconColor={COLORS.primary}
                    style={{ margin: 0 }}
                  />
                  <Text variant="bodyMedium" style={styles.modalText}>
                    Para: {activityAssignedTo}
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
                  iconColor={COLORS.primary}
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
                    style={{
                      marginVertical: 12,
                      backgroundColor: COLORS.border,
                    }}
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
            <Dialog.Actions
              style={{ paddingHorizontal: 24, paddingBottom: 16 }}
            >
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
          </Animated.View>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    ...SHADOWS.card,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden", // Important for clipping the accent border
  },
  cardWrapperCompleted: {
    backgroundColor: "#F5F5F5",
  },
  accentBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: COLORS.primary,
  },
  actionButtonLeft: {
    margin: 0,
    marginRight: 8, // Increased separation
    marginLeft: 12, // More space from accent border
  },
  pressableArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingLeft: 12, // Adjusted padding because of manual elements
    borderRadius: 16,
    //overflow: "hidden", // Removing this from here, keeping on cardWrapper
  },

  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: COLORS.primary,
    opacity: 0.9,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  assignedToContainer: {
    marginTop: 4,
  },
  assignedToText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButton: {
    margin: 0,
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
  dialogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 0,
    marginTop: -8,
    marginRight: -12,
  },
});
