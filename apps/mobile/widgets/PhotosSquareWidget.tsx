import React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";

interface PhotosSquareWidgetProps {
  imageBase64?: string;
  error?: string;
}

export function PhotosSquareWidget({
  imageBase64,
  error,
}: PhotosSquareWidgetProps) {
  // Dynamic background: Black for photo, White for empty state
  const bgColor = imageBase64 ? "#000000" : "#FFFFFF";

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: bgColor,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
      clickAction="OPEN_APP"
    >
      {imageBase64 ? (
        // @ts-ignore
        <ImageWidget
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          image={imageBase64 as any}
          imageWidth={500}
          imageHeight={500}
          style={{
            height: "match_parent",
            width: "match_parent",
          }}
          radius={16}
          resizeMode="cover"
        />
      ) : (
        <FlexWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 12,
          }}
        >
          {/* Fallback Icon / Image */}
          {/* eslint-disable-next-line */}
          {/* @ts-ignore */}
          <ImageWidget
            image={require("../assets/images/ele-def-fondo-cuad.png")}
            imageWidth={32}
            imageHeight={32}
            style={{
              width: 32,
              height: 32,
              marginBottom: 8,
            }}
            radius={8}
          />
          <TextWidget
            text={error || "Sin fotos"}
            style={{
              fontSize: 10,
              color: "#333",
              fontWeight: "bold",
              textAlign: "center",
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
