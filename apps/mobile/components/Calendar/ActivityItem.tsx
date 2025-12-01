import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, List, IconButton } from "react-native-paper";
import { Activity, GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";
import { COLORS } from "@/styles/base";

interface ActivityItemProps {
  item: Activity;
  idUser: string;
  onEdit: (ev: Activity) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (ev: Activity) => void;
  isOwnerOfGroup: boolean;
  groupInfo?: GetFamilyGroupIdGroupMembers200;
  completed?: boolean; // Nueva prop para completado por día
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
}: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Usar completed de la prop si está disponible, sino usar item.completed
  const isCompleted = completed !== undefined ? completed : item.completed;

  // Find the owner of this activity
  const activityOwner = (() => {
    if (!groupInfo) return null;
    if (groupInfo.owner.id === item.createdBy) {
      return groupInfo.owner.displayName;
    }
    const member = groupInfo.members.find((m) => m.id === item.createdBy);
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
    <Card style={[styles.card, isCompleted && styles.completedCard]}>
      <List.Item
        style={styles.listItem}
        titleStyle={isCompleted && { textDecorationLine: "line-through" }}
        title={item.title}
        description={
          <View>
            <Text variant="bodySmall" style={styles.timeText}>
              {timeDescription}
            </Text>
            {activityOwner && (
              <Text variant="bodySmall" style={styles.ownerText}>
                Por: {activityOwner}
              </Text>
            )}
          </View>
        }
        onPress={hasDescription ? () => setExpanded(!expanded) : undefined}
        left={() => (
          <View style={styles.checkboxContainer}>
            <IconButton
              icon={isCompleted ? "checkbox-marked" : "checkbox-blank-outline"}
              iconColor={isCompleted ? COLORS.primary : COLORS.textLight}
              size={24}
              onPress={() => onToggleComplete(item)}
            />
          </View>
        )}
        right={() => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {hasDescription && (
              <IconButton
                icon={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                onPress={() => setExpanded(!expanded)}
              />
            )}
            {canEdit && (
              <>
                <IconButton
                  icon="pencil"
                  iconColor={COLORS.primary}
                  size={20}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                />
                <IconButton
                  icon="delete"
                  iconColor={COLORS.error}
                  size={20}
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                />
              </>
            )}
          </View>
        )}
      />
      {hasDescription && expanded && (
        <Card.Content style={styles.descriptionContent}>
          <Text variant="bodyMedium" style={styles.descriptionText}>
            {item.description}
          </Text>
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: COLORS.backgroundTertiary,
    opacity: 0.7,
    shadowOpacity: 0.03,
  },
  listItem: {
    paddingVertical: 2,
    paddingHorizontal: 4,
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
  descriptionContent: {
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
    paddingLeft: 27,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
