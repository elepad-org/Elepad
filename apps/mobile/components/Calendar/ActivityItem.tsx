import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, List, IconButton } from "react-native-paper";
import { Activity, GetFamilyGroupIdGroupMembers200 } from "@elepad/api-client";

interface ActivityItemProps {
  item: Activity;
  idUser: string;
  onEdit: (ev: Activity) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (ev: Activity) => void;
  isOwnerOfGroup: boolean;
  groupInfo?: GetFamilyGroupIdGroupMembers200;
}

export default function ActivityItem({
  item,
  idUser,
  onEdit,
  onDelete,
  onToggleComplete,
  isOwnerOfGroup,
  groupInfo,
}: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);

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
    <Card style={[styles.card, item.completed && styles.completedCard]}>
      <List.Item
        titleStyle={item.completed && { textDecorationLine: "line-through" }}
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
              icon={
                item.completed ? "checkbox-marked" : "checkbox-blank-outline"
              }
              iconColor={item.completed ? "#28a745" : "#6c757d"}
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
                  iconColor="#8998AF"
                  size={20}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                />
                <IconButton
                  icon="delete"
                  iconColor="#dc3545"
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
    marginBottom: 14,
    borderRadius: 24,
    elevation: 0,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(137, 152, 175, 0.2)",
    overflow: "hidden",
  },
  completedCard: {
    backgroundColor: "rgba(248, 249, 250, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(137, 152, 175, 0.15)",
    opacity: 0.7,
  },
  checkboxContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    color: "#495057",
    marginBottom: 2,
  },
  ownerText: {
    color: "#6c757d",
    fontStyle: "italic",
  },
  descriptionContent: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  descriptionText: {
    color: "#495057",
    lineHeight: 22,
  },
});
