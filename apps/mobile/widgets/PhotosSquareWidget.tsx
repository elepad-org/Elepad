import React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from "react-native-android-widget";
import itemPlaceholder from "../assets/images/ele-def-fondo-cuad.png";

interface PhotosSquareWidgetProps {
  imageBase64?: string;
  error?: string;
  isLoading?: boolean;
}

export function PhotosSquareWidget({
  imageBase64,
  error,
  isLoading,
}: PhotosSquareWidgetProps) {
  // Dynamic background: Black for photo, Light gray for empty state
  const bgColor = imageBase64 ? "#000000" : "#F5F5F5";

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: bgColor,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
      }}
      clickAction="OPEN_APP"
    >
      {imageBase64 ? (
        <ImageWidget
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          image={imageBase64 as any}
          imageWidth={800}
          imageHeight={800}
          style={{
            height: "match_parent",
            width: "match_parent",
          }}
          radius={20}
          // @ts-expect-error Library types missing resizeMode
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
            padding: 16,
          }}
        >
          {isLoading ? (
            <>
              <TextWidget
                text="↻"
                style={{
                  fontSize: 24,
                  color: "#999999",
                  marginBottom: 8,
                }}
              />
              <TextWidget
                text="Cargando..."
                style={{
                  fontSize: 11,
                  color: "#666666",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              />
            </>
          ) : (
            <>
              {/* Fallback Icon / Image */}
              {/* eslint-disable-next-line */}
              {/* @ts-ignore */}
              <ImageWidget
                image={itemPlaceholder}
                imageWidth={40}
                imageHeight={40}
                style={{
                  width: 40,
                  height: 40,
                  marginBottom: 10,
                }}
                radius={10}
              />
              <TextWidget
                text={error || "Sin fotos"}
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              />
            </>
          )}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
