import React from "react";
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
  OverlapWidget,
} from "react-native-android-widget";

interface RecentPhotosWidgetProps {
  imageBase64?: string;
  caption?: string;
  date?: string;
  error?: string;
}

export function RecentPhotosWidget({
  imageBase64,
  caption,
  date,
  error,
}: RecentPhotosWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#000000",
        borderRadius: 16,
      }}
      clickAction="OPEN_APP"
    >
      {imageBase64 ? (
        <OverlapWidget
          style={{
            height: "match_parent",
            width: "match_parent",
          }}
        >
          {/* Layer 1: Background Image */}
          {/* @ts-ignore */}
          <ImageWidget
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            image={imageBase64 as any}
            imageWidth={500}
            imageHeight={500}
            style={{
              height: "match_parent",
              width: "match_parent",
            }}
            radius={24}
            resizeMode="cover"
          />

          {/* Layer 2: Gradient Overlay (Simulated with FlexWidget) */}
          <FlexWidget
            style={{
              height: "match_parent",
              width: "match_parent",
              backgroundColor: "#00000060",
              borderRadius: 24,
            }}
          />

          {/* Layer 3: Content */}
          <FlexWidget
            style={{
              height: "match_parent",
              width: "match_parent",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            {/* Top Row: Refresh Button */}
            <FlexWidget
              style={{
                width: "match_parent",
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <FlexWidget
                style={{
                  backgroundColor: "#FFFFFF40",
                  borderRadius: 12,
                  padding: 8,
                }}
                clickAction="REFRESH"
              >
                <TextWidget
                  text="↻"
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                />
              </FlexWidget>
            </FlexWidget>

            {/* Bottom: Text Info */}
            <FlexWidget
              style={{
                flexDirection: "column",
              }}
            >
              <TextWidget
                text="ÚLTIMO RECUERDO"
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: "bold",
                  marginBottom: 4,
                  letterSpacing: 1,
                }}
              />
              {caption ? (
                <TextWidget
                  text={caption}
                  maxLines={2}
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                />
              ) : null}
              {date ? (
                <TextWidget
                  text={date}
                  style={{
                    color: "#E5E7EB",
                    fontSize: 11,
                  }}
                />
              ) : null}
            </FlexWidget>
          </FlexWidget>
        </OverlapWidget>
      ) : (
        <FlexWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
          }}
          clickAction="OPEN_APP"
        >
          {/* Fallback Icon / Image */}
          {/* eslint-disable-next-line */}
          {/* @ts-ignore */}
          <ImageWidget
            image={require("../assets/images/ele-def-fondo-cuad.png")}
            imageWidth={48}
            imageHeight={48}
            style={{
              width: 48,
              height: 48,
              marginBottom: 12,
            }}
            radius={8}
          />

          <TextWidget
            text={error || "Sin fotos recientes"}
            style={{
              fontSize: 14,
              color: "#333333",
              fontWeight: "bold",
              textAlign: "center",
            }}
          />
          <TextWidget
            text="Toca para abrir Elepad"
            style={{
              fontSize: 11,
              color: "#666666",
              marginTop: 6,
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
