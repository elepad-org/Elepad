import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, List, Button, IconButton } from "react-native-paper";
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
          <IconButton
            icon="check"
            iconColor={item.completed ? "#28a745" : "#6c757d"}
            size={20}
            onPress={() => onToggleComplete(item)}
          />
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
                <Button
                  compact
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  Editar
                </Button>
                <Button
                  compact
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  Borrar
                </Button>
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
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  completedCard: {
    backgroundColor: "#d4edda",
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
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  descriptionText: {
    color: "#495057",
    lineHeight: 22,
  },
});
