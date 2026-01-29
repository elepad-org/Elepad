import React from "react";
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
  OverlapWidget,
} from "react-native-android-widget";
import itemPlaceholder from "../assets/images/ele-def-fondo-cuad.png";

interface RecentPhotosWidgetProps {
  imageBase64?: string;
  title?: string;
  caption?: string;
  date?: string;
  error?: string;
  isLoading?: boolean;
}

export function RecentPhotosWidget({
  imageBase64,
  title,
  date,
  error,
  isLoading,
}: RecentPhotosWidgetProps) {
  return (
    <FlexWidget
      style={{
        padding: 20, // Marco blanco uniforme (Polaroid style)
        flexDirection: "column",
      }}
      clickAction="OPEN_APP"
    >
    <FlexWidget
      style={{
        height: "wrap_content",
        width: "wrap_content",
        backgroundColor: "#FFFFFF",
        
        padding: 12, // Marco blanco uniforme (Polaroid style)
        flexDirection: "column",
      }}
    >
      {imageBase64 ? (
        <FlexWidget>
          {/* 1. ÁREA DE LA FOTO (Ocupa la mayor parte) */}
          <FlexWidget
            style={{
              flex: 1,
              width: "match_parent",
              backgroundColor: "#F0F0F0", // Fondo gris suave mientras carga la imagen
              borderRadius: 4, // Un radio muy sutil a la foto interna queda mejor
              marginBottom: 10, // Separación entre foto y texto
            }}
          >
            <OverlapWidget
              style={{
                height: "match_parent",
                width: "match_parent",
              }}
            >
              <ImageWidget
                image={imageBase64 as any}
                imageWidth={800}
                imageHeight={800}
                radius={4}
                style={{
                  height: "match_parent",
                  width: "match_parent",
                }}
                // Importante: 'cover' recorta la imagen para llenar el cuadro sin deformar
                // @ts-ignore
                contentFit="cover" 
              />

              {/* Botón de Refrescar (Discreto en la esquina) */}
              <FlexWidget
                style={{
                  height: "match_parent",
                  width: "match_parent",
                  justifyContent: "flex-end", // Alinear a la derecha
                  alignItems: "flex-start",   // Alinear arriba
                  flexDirection: "row",
                  padding: 6,
                }}
              >
                <FlexWidget
                  style={{
                    backgroundColor: "#FFFFFFCC", // Blanco semitransparente
                    borderRadius: 12,
                    
                  }}
                  clickAction="WIDGET_UPDATE"
                >
                  <TextWidget
                    text="↻"
                    style={{
                      color: "#333333",
                    }}
                  />
                </FlexWidget>
              </FlexWidget>
            </OverlapWidget>
          </FlexWidget>

          {/* 2. ÁREA DE TEXTO (Pie de foto) */}
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {title ? (
              <TextWidget
                text={title}
                maxLines={1}
                style={{
                  color: "#222222", // Negro suave, más elegante
                  fontSize: 15,
                  fontWeight: "bold",
                  marginBottom: 4,
                  fontFamily: "sans-serif-medium",
                }}
              />
            ) : null}
            
            {date ? (
              <TextWidget
                text={date}
                style={{
                  color: "#666666", // Gris para información secundaria
                  fontSize: 12,
                  fontWeight: "normal",
                }}
              />
            ) : null}
          </FlexWidget>
        </FlexWidget>
      ) : (
        /* ESTADO DE CARGA / ERROR / VACÍO */
        <FlexWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FAFAFA",
            borderRadius: 16,
          }}
          clickAction="WIDGET_UPDATE"
        >
          {isLoading ? (
            <FlexWidget>
              <TextWidget
                text="↻"
                style={{
                  fontSize: 24,
                  color: "#AAAAAA",
                  marginBottom: 8,
                }}
              />
              <TextWidget
                text="Cargando recuerdo..."
                style={{ fontSize: 12, color: "#888888" }}
              />
            </FlexWidget>
          ) : (
            <FlexWidget>
              <ImageWidget
                image={itemPlaceholder}
                imageWidth={64}
                imageHeight={64}
                style={{ width: 48, height: 48, marginBottom: 12}}
              />
              <TextWidget
                text={error || "Sin fotos"}
                style={{
                  fontSize: 14,
                  color: "#444444",
                  fontWeight: "bold",
                  marginBottom: 4,
                }}
              />
              <TextWidget
                text="Toca para actualizar"
                style={{ fontSize: 10, color: "#999999" }}
              />
            </FlexWidget>
          )}
        </FlexWidget>
      )}
    </FlexWidget>
  </FlexWidget>
  );
}