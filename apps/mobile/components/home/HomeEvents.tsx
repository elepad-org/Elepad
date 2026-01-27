import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import Animated, { ZoomIn } from "react-native-reanimated";
import { COLORS, SHADOWS } from "@/styles/base";
import { SkeletonBox } from "@/components/shared";
import HighlightedMentionText from "@/components/Recuerdos/HighlightedMentionText";
import { formatInUserTimezone, toUserLocalTime } from "@/lib/timezoneHelpers";

interface Event {
  id: string;
  startsAt: string;
  title: string;
  description?: string;
}

interface HomeEventsProps {
  isLoading: boolean;
  events: Event[];
  timezone?: string;
  groupMembers: any[];
  onRestartTour: () => void;
  debugTaps: number;
  setDebugTaps: (taps: number) => void;
}

const HomeEvents = memo(({
  isLoading,
  events,
  timezone,
  groupMembers,
  onRestartTour,
  debugTaps,
  setDebugTaps,
}: HomeEventsProps) => {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Próximos{" "}
          <Text
            onPress={() => {
              const newTaps = debugTaps + 1;
              setDebugTaps(newTaps);
              if (newTaps >= 10) {
                setDebugTaps(0);
                onRestartTour();
              }
            }}
            suppressHighlighting={true}
          >
            eventos
          </Text>
        </Text>
        {events.length > 0 && (
          <Button
            mode="text"
            onPress={() => {
              router.navigate({
                pathname: "/(tabs)/home",
                params: {
                  tab: "calendar",
                },
              });
            }}
            labelStyle={styles.sectionLink}
            compact
          >
            Ver todos
          </Button>
        )}
      </View>

      <>
        {isLoading ? (
          <View style={[styles.eventsContainer, { marginTop: 0 }]}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.eventItem}>
                <View style={styles.eventTime}>
                  <SkeletonBox
                    width={60}
                    height={16}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <SkeletonBox width={50} height={14} borderRadius={4} />
                </View>
                <View style={styles.eventDivider} />
                <View style={styles.eventContent}>
                  <SkeletonBox
                    width="80%"
                    height={18}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <SkeletonBox width="60%" height={14} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : events.length > 0 ? (
          <View style={[styles.eventsContainer, { marginTop: 0 }]}>
            {events.map((activity, index) => {
              const activityDate = toUserLocalTime(
                activity.startsAt,
                timezone
              );
              const now = toUserLocalTime(new Date(), timezone);
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);

              const isToday =
                activityDate.toDateString() === now.toDateString();
              const isTomorrow =
                activityDate.toDateString() === tomorrow.toDateString();

              let dateLabel = formatInUserTimezone(
                activity.startsAt,
                "d MMM",
                timezone
              );

              if (isToday) dateLabel = "Hoy";
              if (isTomorrow) dateLabel = "Mañana";

              return (
                <Pressable
                  key={activity.id}
                  onPress={() => {
                    console.log(
                      "🏠 Home: Navigating to calendar with activity",
                      {
                        activityId: activity.id,
                        title: activity.title,
                        startsAt: activity.startsAt,
                      }
                    );
                    router.navigate({
                      pathname: "/(tabs)/home",
                      params: {
                        tab: "calendar",
                        activityId: activity.id,
                      },
                    });
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Animated.View
                    entering={ZoomIn.duration(200).delay(index * 50)}
                    style={styles.eventItem}
                  >
                    <View style={styles.eventTime}>
                      <Text style={styles.eventDate}>{dateLabel}</Text>
                      <Text style={styles.eventHour}>
                        {formatInUserTimezone(
                          activity.startsAt,
                          "HH:mm",
                          timezone
                        )}
                      </Text>
                    </View>
                    <View style={styles.eventDivider} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {activity.title}
                      </Text>
                      {activity.description && (
                        <HighlightedMentionText
                          text={activity.description}
                          groupMembers={groupMembers}
                          style={styles.eventDesc}
                          numberOfLines={1}
                        />
                      )}
                    </View>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptySection, { marginTop: 0 }]}>
            <Text style={styles.emptyText}> No hay eventos próximos </Text>
            <Button
              mode="outlined"
              onPress={() => {
                router.navigate({
                  pathname: "/(tabs)/home",
                  params: {
                    tab: "calendar",
                    openForm: "true",
                  },
                });
              }}
              style={styles.emptyButtonOutline}
              textColor={COLORS.primary}
              icon="calendar-plus"
            >
              Crear evento
            </Button>
          </View>
        )}
      </>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 0,
  },
  sectionLink: {
    fontSize: 14,
    color: COLORS.primary,
  },
  eventsContainer: {
    gap: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  eventTime: {
    alignItems: "center",
    minWidth: 70,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 3,
  },
  eventHour: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  eventDivider: {
    width: 3,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.3,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  emptyButtonOutline: {
    borderRadius: 12,
    borderColor: COLORS.primary,
  },
});

export default HomeEvents;
