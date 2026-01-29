import React from "react";
import {
  FlexWidget,
  TextWidget,
} from "react-native-android-widget";

interface Activity {
  id: string;
  title: string;
  startsAt: string;
  createdBy: string;
  assignedTo: string | null;
  assignedToName: string;
  completed: boolean;
}

interface DailyActivitiesWidgetProps {
  activities?: Activity[];
  error?: string;
  isLoading?: boolean;
  isElder?: boolean;
}

export function DailyActivitiesWidget({
  activities,
  error,
  isLoading,
  isElder,
}: DailyActivitiesWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#FFFFFF",
        padding: 12,
        flexDirection: "column",
      }}
      clickAction="OPEN_APP"
    >
      {/* Header con título y botón de refrescar */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Actividades de Hoy"
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#333333",
          }}
        />
        
        {/* Botón de Refrescar */}
        <FlexWidget
          style={{
            backgroundColor: "#F0F0F0",
            borderRadius: 12,
            padding: 4,
          }}
          clickAction="WIDGET_UPDATE"
        >
          <TextWidget
            text="↻"
            style={{
              fontSize: 14,
              color: "#333333",
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Contenido principal */}
      {isLoading ? (
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="Cargando..."
            style={{
              fontSize: 14,
              color: "#666666",
            }}
          />
        </FlexWidget>
      ) : error ? (
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text={error}
            style={{
              fontSize: 14,
              color: "#666666",
              textAlign: "center",
            }}
          />
        </FlexWidget>
      ) : !activities || activities.length === 0 ? (
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="No hay actividades programadas"
            style={{
              fontSize: 14,
              color: "#666666",
              textAlign: "center",
            }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "column",
          }}
        >
          {activities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} isFirst={index === 0} isElder={isElder} />
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

interface ActivityCardProps {
  activity: Activity;
  isFirst: boolean;
  isElder?: boolean;
}

function ActivityCard({ activity, isFirst, isElder }: ActivityCardProps) {
  const isCompleted = activity.completed;
  
  // Parse time from startsAt
  const time = new Date(activity.startsAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Determine metadata text based on user role
  let metadataText = "";
  if (isElder) {
    metadataText = time;
  } else {
    if (activity.assignedToName) {
      metadataText = `Para: ${activity.assignedToName}`;
    } else {
      metadataText = activity.assignedTo ? `Para: Usuario` : "Sin asignar";
    }
  }

  // Add completion status if completed
  if (isCompleted) {
    metadataText += " • Completada";
  }

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        flexDirection: "column",
        paddingTop: isFirst ? 0 : 8,
        paddingBottom: 8,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: "#E0E0E0",
      }}
    >
      {/* Título */}
      <TextWidget
        text={activity.title}
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: isCompleted ? "#999999" : "#333333",
          marginBottom: 4,
        }}
      />
      
      {/* Metadata */}
      <TextWidget
        text={metadataText}
        style={{
          fontSize: 12,
          color: isCompleted ? "#AAAAAA" : "#666666",
        }}
      />
    </FlexWidget>
  );
}
