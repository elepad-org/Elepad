import React from "react";
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from "react-native-android-widget";

/**
 * Widget de Recuerdos - Versión Base
 *
 * CARACTERÍSTICAS:
 * - Ancho completo: edge-to-edge
 * - Alto fijo: 280dp
 * - Imagen sin compresión (centerCrop)
 * - Gradiente overlay
 * - Diseño idéntico al home
 */
export function RecuerdosWidget() {
  // Imagen de ejemplo de un paisaje hermoso
  const exampleImageUrl =
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";

  return (
    <FlexWidget
      style={{
        height: 280,
        width: "match_parent",
      }}
      clickAction="OPEN_APP"
    >
      {/* Imagen de fondo */}
      <ImageWidget
        image={exampleImageUrl}
        style={{
          width: "match_parent",
          height: "match_parent",
        }}
        scaleType="centerCrop"
      />

      {/* Overlay oscuro en toda la imagen */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
      />

      {/* Gradiente más oscuro abajo */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: 150,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Indicadores de página (dots) - arriba a la derecha */}
      <FlexWidget
        style={{
          flexDirection: "row",
          gap: 6,
          padding: 12,
        }}
      >
        {/* Dot activo */}
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#FFFFFF",
          }}
        />
        {/* Dots inactivos */}
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          }}
        />
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          }}
        />
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          }}
        />
        <FlexWidget
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
          }}
        />
      </FlexWidget>

      {/* Contenido de texto - abajo */}
      <FlexWidget
        style={{
          padding: 24,
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Label */}
        <TextWidget
          text="RECUERDOS RECIENTES"
          style={{
            fontSize: 11,
            color: "#FFFFFF",
            fontFamily: "sans-serif-medium",
          }}
        />

        {/* Título */}
        <TextWidget
          text="Día en la playa con la familia"
          style={{
            fontSize: 24,
            color: "#FFFFFF",
            fontFamily: "sans-serif",
            maxLines: 2,
          }}
        />

        {/* Caption */}
        <TextWidget
          text="Un hermoso día soleado disfrutando del mar y la arena"
          style={{
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.9)",
            fontFamily: "sans-serif",
            maxLines: 2,
          }}
        />

        {/* Fecha */}
        <TextWidget
          text="15 de enero de 2026"
          style={{
            fontSize: 13,
            color: "rgba(255, 255, 255, 0.8)",
            fontFamily: "sans-serif-medium",
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
