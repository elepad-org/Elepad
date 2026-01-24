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
        // @ts-ignore
        <ImageWidget
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          image={imageBase64 as any}
          style={{
            height: "match_parent",
            width: "match_parent",
          }}
          radius={24}
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
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 12,
          }}
          clickAction="OPEN_APP"
        >
          {/* Fallback Icon / Image */}
          {/* eslint-disable-next-line */}
          {/* @ts-ignore */}
          <ImageWidget
            image={require("../../assets/images/ele-def-fondo-cuad.png")}
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
