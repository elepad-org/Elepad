# Plan de Implementación: Widget de Recuerdos para Elepad

## 📋 Resumen Ejecutivo

Después de analizar tu aplicación completa, he diseñado una estrategia óptima para implementar un widget de recuerdos que muestre los últimos 5 recuerdos con transiciones suaves y minimalistas.

**Recomendación Principal: Solo Android (por ahora)**

Dado que iOS requiere SwiftUI nativo y tiene limitaciones significativas en cuanto a actualización de datos y complejidad, recomiendo **comenzar solo con Android** para lograr la funcionalidad que deseas con mayor facilidad.

---

## 🎨 Diseño del Widget

### Especificaciones Visuales

**Dimensiones:**

- **Ancho:** Todo el ancho de la pantalla (edge to edge)
- **Alto:** 280dp (mismo que la card de recuerdo en home.tsx)
- **Tamaño fijo:** No redimensionable

**Características de Diseño:**

1. **Idéntico al último recuerdo del home** con:
   - Imagen de fondo con gradiente oscuro en la parte inferior
   - Label "ÚLTIMO RECUERDO" (actualizado a "RECUERDOS RECIENTES")
   - Título del recuerdo
   - Caption con menciones (limitado)
   - Fecha formateada
   - Icono de corazón para recuerdos sin imagen

2. **Transición automática:**
   - Cada 8-10 segundos cambia al siguiente recuerdo
   - Efecto de fade cruzado (cross-fade) suave
   - Indicador de página (dots) en la parte superior derecha

3. **Interactividad:**
   - Al tocar el widget, abre la app en la pantalla de recuerdos
   - Al tocar, se enfoca en el recuerdo específico que se está mostrando

---

## 🏗️ Arquitectura Técnica

### Opción Recomendada: `react-native-android-widget`

Esta librería permite crear widgets Android usando React Native (JavaScript), evitando escribir código nativo:

**Ventajas:**

- ✅ Código en JavaScript/TypeScript (no requiere Kotlin/Java)
- ✅ Soporta widgets redimensionables y configurables
- ✅ Integración con React Native y Expo
- ✅ Actualización de datos desde la app principal
- ✅ Soporte para Reanimated (animaciones)

**Desventajas:**

- ⚠️ Solo Android
- ⚠️ Requiere `expo prebuild` (no funciona con Expo Go)
- ⚠️ Necesita configuración nativa adicional

---

## 📦 Estructura de Implementación

### 1. Instalación y Configuración

```bash
# Instalar la librería
npm install react-native-android-widget

# Generar código nativo
npx expo prebuild --platform android

# Nota: Después de esto, deberás usar "npx expo run:android" en lugar de "expo start"
```

### 2. Configuración en app.json

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-android-widget",
        {
          "widgets": [
            {
              "name": "RecuerdosWidget",
              "label": "Recuerdos Recientes",
              "description": "Muestra tus últimos recuerdos guardados",
              "minWidth": "320dp",
              "minHeight": "280dp",
              "maxResizeWidth": "320dp",
              "maxResizeHeight": "280dp",
              "resizeMode": "none",
              "updatePeriodMillis": 0,
              "previewImage": "./assets/widget-preview.png",
              "widgetFeatures": "reconfigurable"
            }
          ]
        }
      ]
    ]
  }
}
```

### 3. Estructura de Archivos

```
apps/mobile/
├── widgets/
│   ├── RecuerdosWidget.tsx          # Componente principal del widget
│   ├── RecuerdosWidgetPreview.tsx   # Preview para configuración
│   ├── widgetTaskHandler.ts         # Lógica de actualización
│   └── styles.ts                    # Estilos del widget
├── lib/
│   └── widgetDataManager.ts         # Gestión de datos compartidos
└── app.json                         # Configuración de plugins
```

---

## 💻 Código de Implementación

### Componente del Widget (`widgets/RecuerdosWidget.tsx`)

```tsx
import React from "react";
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from "react-native-android-widget";

interface Memory {
  id: string;
  title: string;
  caption?: string;
  mediaUrl?: string;
  mimeType?: string;
  createdAt: string;
}

interface WidgetData {
  memories: Memory[];
  currentIndex: number;
}

export function RecuerdosWidget({ data }: { data: WidgetData }) {
  const currentMemory = data.memories[data.currentIndex % data.memories.length];

  if (!currentMemory) {
    return (
      <FlexWidget
        style={{
          width: "match_parent",
          height: 280,
          backgroundColor: "#F5F5F5",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="No hay recuerdos"
          style={{
            fontSize: 18,
            color: "#666",
            fontWeight: "600",
          }}
        />
        <TextWidget
          text="Abre Elepad para crear tus primeros recuerdos"
          style={{
            fontSize: 14,
            color: "#999",
            marginTop: 8,
            textAlign: "center",
          }}
        />
      </FlexWidget>
    );
  }

  const hasImage =
    currentMemory.mediaUrl && currentMemory.mimeType?.startsWith("image/");

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: 280,
        position: "relative",
      }}
      clickAction="OPEN_APP"
      clickActionData={{
        memoryId: currentMemory.id,
        screen: "recuerdos",
      }}
    >
      {/* Imagen de fondo o color sólido */}
      {hasImage ? (
        <ImageWidget
          image={currentMemory.mediaUrl}
          style={{
            width: "match_parent",
            height: "match_parent",
            position: "absolute",
          }}
          contentFit="cover"
        />
      ) : (
        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            backgroundColor: "#F5F5F5",
            position: "absolute",
          }}
        />
      )}

      {/* Overlay con gradiente */}
      {hasImage && (
        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            position: "absolute",
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          }}
        />
      )}

      {/* Indicador de páginas */}
      <FlexWidget
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          flexDirection: "row",
          gap: 6,
        }}
      >
        {data.memories.slice(0, 5).map((_, index) => (
          <FlexWidget
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                index === data.currentIndex
                  ? hasImage
                    ? "#FFFFFF"
                    : "#8896B0"
                  : hasImage
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(136,150,176,0.4)",
            }}
          />
        ))}
      </FlexWidget>

      {/* Contenido */}
      <FlexWidget
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          gap: 6,
        }}
      >
        {/* Label */}
        <TextWidget
          text="RECUERDOS RECIENTES"
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: hasImage ? "#FFFFFF" : "#8896B0",
            letterSpacing: 1.5,
            marginBottom: 4,
          }}
        />

        {/* Título */}
        <TextWidget
          text={currentMemory.title || "Sin título"}
          maxLines={2}
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: hasImage ? "#FFFFFF" : "#1A1A1A",
            lineHeight: 30,
          }}
        />

        {/* Caption */}
        {currentMemory.caption && (
          <TextWidget
            text={currentMemory.caption}
            maxLines={2}
            style={{
              fontSize: 15,
              color: hasImage ? "rgba(255,255,255,0.9)" : "#666",
              lineHeight: 22,
            }}
          />
        )}

        {/* Fecha */}
        <TextWidget
          text={formatDate(currentMemory.createdAt)}
          style={{
            fontSize: 13,
            color: hasImage ? "rgba(255,255,255,0.8)" : "#8896B0",
            fontWeight: "600",
            marginTop: 4,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}
```

### Task Handler para Actualización Automática (`widgets/widgetTaskHandler.ts`)

```typescript
import { WidgetTaskHandlerProps } from "react-native-android-widget";
import { getWidgetData, updateWidgetIndex } from "@/lib/widgetDataManager";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetAction = props.widgetAction;

  // Obtener datos actuales
  const data = await getWidgetData();

  switch (widgetAction) {
    case "UPDATE_WIDGET":
      // Avanzar al siguiente recuerdo
      const newIndex =
        (data.currentIndex + 1) % Math.min(data.memories.length, 5);
      await updateWidgetIndex(newIndex);

      // Programar siguiente actualización en 8 segundos
      return {
        ...data,
        currentIndex: newIndex,
      };

    default:
      return data;
  }
}
```

### Gestión de Datos Compartidos (`lib/widgetDataManager.ts`)

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMemories } from "@elepad/api-client";

const WIDGET_DATA_KEY = "@elepad_widget_memories";

interface WidgetMemoryData {
  memories: Array<{
    id: string;
    title: string;
    caption?: string;
    mediaUrl?: string;
    mimeType?: string;
    createdAt: string;
  }>;
  currentIndex: number;
  lastUpdate: string;
}

/**
 * Obtiene los datos del widget desde AsyncStorage
 */
export async function getWidgetData(): Promise<WidgetMemoryData> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error al obtener datos del widget:", error);
  }

  return {
    memories: [],
    currentIndex: 0,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Actualiza los recuerdos del widget desde la API
 */
export async function updateWidgetMemories(
  groupId: string,
  bookId?: string,
): Promise<void> {
  try {
    // Obtener últimos 5 recuerdos
    const response = await getMemories({
      familyGroupId: groupId,
      bookId,
      limit: 5,
      offset: 0,
    });

    const memories =
      response.data?.map((memory) => ({
        id: memory.id,
        title: memory.title || "Sin título",
        caption: memory.caption,
        mediaUrl: memory.mediaUrl,
        mimeType: memory.mimeType,
        createdAt: memory.createdAt,
      })) || [];

    const widgetData: WidgetMemoryData = {
      memories,
      currentIndex: 0,
      lastUpdate: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(widgetData));

    // Actualizar el widget
    const { requestWidgetUpdate } = await import("react-native-android-widget");
    await requestWidgetUpdate({ widgetName: "RecuerdosWidget" });
  } catch (error) {
    console.error("Error al actualizar recuerdos del widget:", error);
  }
}

/**
 * Actualiza el índice actual del widget
 */
export async function updateWidgetIndex(newIndex: number): Promise<void> {
  try {
    const data = await getWidgetData();
    data.currentIndex = newIndex;
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error al actualizar índice del widget:", error);
  }
}

/**
 * Limpia los datos del widget
 */
export async function clearWidgetData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WIDGET_DATA_KEY);
  } catch (error) {
    console.error("Error al limpiar datos del widget:", error);
  }
}
```

### Integración en la App Principal

```typescript
// En app/(tabs)/recuerdos.tsx o donde se creen/actualicen recuerdos

import { updateWidgetMemories } from "@/lib/widgetDataManager";
import { useUserElepad } from "@/hooks/useUserElepad";

// Después de crear/actualizar un recuerdo:
const { data: userElepad } = useUserElepad();

if (userElepad?.groupId) {
  // Actualizar datos del widget
  await updateWidgetMemories(userElepad.groupId);
}
```

---

## 🎯 Funcionalidades Clave

### 1. Actualización Automática

El widget se actualiza automáticamente:

- **Cada 8 segundos:** Cambia al siguiente recuerdo (usando WorkManager de Android)
- **Al abrir la app:** Sincroniza con los últimos recuerdos de Supabase
- **Al crear/editar recuerdo:** Actualización inmediata

### 2. Transiciones Suaves

```typescript
// Configuración de animación en el widget
import { AnimatedWidget } from 'react-native-android-widget';

<AnimatedWidget
  animation={{
    type: 'crossfade',
    duration: 500,
    easing: 'ease-in-out'
  }}
>
  {/* Contenido del recuerdo */}
</AnimatedWidget>
```

### 3. Gestión de Memoria

- Solo almacena los últimos 5 recuerdos en AsyncStorage
- Imágenes se cargan bajo demanda
- Caché inteligente para evitar recargas innecesarias

### 4. Manejo de Estados

El widget maneja elegantemente:

- ✅ Sin recuerdos (estado vacío con mensaje motivacional)
- ✅ Recuerdos solo de texto (sin imagen)
- ✅ Recuerdos con imagen/video
- ✅ Errores de red (muestra último estado cargado)

---

## 🔧 Configuración de WorkManager (Auto-rotación)

```kotlin
// android/app/src/main/java/com/elepadorg/elepad/WidgetUpdateWorker.kt
// Este archivo se genera automáticamente, pero puedes personalizarlo

package com.elepadorg.elepad

import android.content.Context
import androidx.work.*
import java.util.concurrent.TimeUnit

class WidgetUpdateWorker(context: Context, params: WorkerParameters)
  : Worker(context, params) {

  override fun doWork(): Result {
    // Incrementar índice del widget
    // La librería maneja esto internamente, pero puedes customizarlo
    return Result.success()
  }
}

// Programar trabajo periódico
fun scheduleWidgetUpdate(context: Context) {
  val workRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
    8, TimeUnit.SECONDS,
    2, TimeUnit.SECONDS
  ).build()

  WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "widget_update",
    ExistingPeriodicWorkPolicy.KEEP,
    workRequest
  )
}
```

---

## 📱 Registro del Widget en la App

```typescript
// app/_layout.tsx o app/index.tsx

import { useEffect } from "react";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "@/widgets/widgetTaskHandler";
import { RecuerdosWidget } from "@/widgets/RecuerdosWidget";

export default function RootLayout() {
  useEffect(() => {
    // Registrar widget
    registerWidgetTaskHandler(widgetTaskHandler);

    // Registrar componente del widget
    registerWidget({
      widgetName: "RecuerdosWidget",
      component: RecuerdosWidget,
    });
  }, []);

  return {
    /* Tu layout normal */
  };
}
```

---

## 🚀 Pasos de Implementación

### Fase 1: Setup Inicial (30 min)

1. ✅ Instalar `react-native-android-widget`
2. ✅ Ejecutar `npx expo prebuild --platform android`
3. ✅ Configurar plugin en `app.json`
4. ✅ Crear imagen de preview del widget

### Fase 2: Desarrollo del Widget (2-3 horas)

1. ✅ Crear componente `RecuerdosWidget.tsx`
2. ✅ Implementar `widgetTaskHandler.ts`
3. ✅ Desarrollar `widgetDataManager.ts`
4. ✅ Registrar widget en la app

### Fase 3: Integración con la App (1-2 horas)

1. ✅ Conectar actualización de recuerdos con widget
2. ✅ Implementar deep linking (abrir recuerdo específico)
3. ✅ Configurar WorkManager para auto-rotación
4. ✅ Manejo de estados vacíos/error

### Fase 4: Testing y Polish (1-2 horas)

1. ✅ Probar en diferentes tamaños de pantalla
2. ✅ Verificar transiciones y animaciones
3. ✅ Optimizar rendimiento
4. ✅ Probar sincronización de datos

### Fase 5: Documentación (30 min)

1. ✅ Documentar cómo agregar el widget
2. ✅ Crear guía de usuario
3. ✅ Actualizar README

**Tiempo Total Estimado: 5-8 horas**

---

## ⚠️ Consideraciones Importantes

### Limitaciones de Android

1. **Tamaño Fijo:**
   - El widget NO será redimensionable (según tu requerimiento)
   - Se configura con `resizeMode: "none"`

2. **Actualización Periódica:**
   - Android limita las actualizaciones a un mínimo de 30 minutos por defecto
   - La rotación interna (cambio de recuerdo) se maneja con WorkManager
   - Actualizaciones manuales posibles desde la app

3. **Memoria:**
   - Los widgets tienen límites de memoria estrictos
   - Se recomienda usar thumbnails/miniaturas de las imágenes
   - Implementar caché eficiente

### Alternativa iOS (Futuro)

Si eventualmente quieres soportar iOS:

**Requerimientos:**

- Escribir widget en Swift/SwiftUI nativo
- Usar `@bacons/apple-targets` plugin
- Configurar App Groups para compartir datos
- Limitación: No puede tener rotación automática (las actualizaciones las controla iOS)
- Complejidad: ⭐⭐⭐⭐⭐ (Mucho más complejo)

**Tiempo estimado iOS:** 10-15 horas adicionales

---

## 🎨 Mejoras Futuras

### Corto Plazo

- [ ] Configuración de intervalo de rotación (5s, 10s, 15s)
- [ ] Opción de widget pequeño (1x1) con solo imagen
- [ ] Temas claro/oscuro siguiendo el sistema

### Mediano Plazo

- [ ] Widget de "Recuerdo del día" (aleatorio)
- [ ] Widget de estadísticas (total recuerdos, streak, etc.)
- [ ] Soporte para iOS (si es necesario)

### Largo Plazo

- [ ] Widget interactivo (agregar reacciones desde el widget)
- [ ] Widget de vista de cuadrícula (múltiples recuerdos)
- [ ] Live Activities para nuevos recuerdos (iOS 16+)

---

## 📚 Recursos y Referencias

### Documentación

- [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget)
- [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [Android Widgets Guide](https://developer.android.com/guide/topics/appwidgets)

### Ejemplos

- [Expo Widget Example](https://github.com/expo/examples/tree/master/with-android-widget)
- [Widget Gallery](https://github.com/sAleksovski/react-native-android-widget/tree/master/example)

---

## ✅ Ventajas de Esta Solución

1. **✨ Diseño Consistente:** Idéntico al diseño de tu app
2. **🎯 Funcionalidad Completa:** Todas las features que pediste
3. **🚀 Performance Óptimo:** Actualización eficiente
4. **🔧 Mantenible:** Código JavaScript/TypeScript familiar
5. **📱 Nativo:** Completamente integrado con Android
6. **🎨 Personalizable:** Fácil de ajustar estilos y comportamiento

---

## 🤔 Alternativas Descartadas

### Opción 1: Widget iOS + Android Nativo

- ❌ Requiere Swift y Kotlin/Java
- ❌ Duplicación de lógica
- ❌ Mantenimiento complejo
- ❌ No aprovecha el stack actual

### Opción 2: Solo usar WorkManager sin react-native-android-widget

- ❌ Mucho más código nativo
- ❌ Difícil de mantener
- ❌ No reutiliza componentes React

### Opción 3: WebView en Widget

- ❌ Performance pobre
- ❌ Limitaciones de Android (widgets no pueden usar WebView directamente)
- ❌ No recomendado por Google

---

## 📞 Próximos Pasos Recomendados

1. **Revisar este plan** y confirmar que cumple con tus expectativas
2. **Decidir sobre iOS:** ¿Realmente lo necesitas ahora o puede esperar?
3. **Preparar assets:** Crear imagen de preview del widget
4. **Comenzar implementación:** Seguir las fases en orden

**¿Estás listo para comenzar? ¿Quieres que empiece con la Fase 1 directamente?** 🚀
