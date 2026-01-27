# 🎨 Widget Preview - Guía de Uso

## ✅ ¡Widget Preview Configurado!

Ahora puedes desarrollar el widget con **hot reload instantáneo** sin necesidad de rebuild. 🚀

---

## 📱 Cómo Acceder al Widget Preview

### Opción 1: Desde Configuración (Recomendado)

1. **Abre la app** (con `npm run dev` en Expo Go)
2. **Ve a la pestaña "Configuración"** (ícono de engranaje)
3. **Busca la sección** "🔧 Herramientas de Desarrollo" (con borde morado)
4. **Tap en "Widget Preview"**
5. ✨ ¡Listo! Ya estás en el preview

**Nota:** Esta sección solo aparece en modo desarrollo (`__DEV__`)

### Opción 2: URL Directa

```typescript
// En cualquier parte de tu código
router.push("/widget-preview");
```

---

## 🔥 Workflow de Desarrollo Rápido

### Paso 1: Abre el Widget Preview

```
App → Configuración → Widget Preview
```

### Paso 2: Abre el archivo del widget en el editor

```
apps/mobile/widgets/RecuerdosWidget.tsx
```

### Paso 3: Haz cambios y guarda (Ctrl+S)

**Ejemplos de cambios que verás instantáneamente:**

```tsx
// Cambiar el título
<TextWidget
  text="MI NUEVO TÍTULO"  // ← Cambiar aquí
  style={...}
/>

// Cambiar colores
<TextWidget
  style={{
    fontSize: 24,
    color: '#FF0000',  // ← De blanco a rojo
  }}
/>

// Cambiar tamaños
<TextWidget
  style={{
    fontSize: 32,  // ← De 24 a 32
    color: '#FFFFFF',
  }}
/>

// Cambiar la imagen
const exampleImageUrl = 'https://nueva-imagen.jpg';
```

### Paso 4: ¡Ve los cambios instantáneamente!

⚡ **Hot reload automático** - 1-2 segundos

---

## 🎯 Funcionalidades del Widget Preview

### Vista en Tiempo Real

- ✅ Tamaño exacto del widget (ancho completo × 280dp)
- ✅ Fondo simulando la home screen
- ✅ Dimensiones exactas mostradas
- ✅ Aspecto idéntico al widget real

### Información Útil

- 📊 Estado del widget seleccionable
- 📱 Simulador de home screen
- 📝 Instrucciones paso a paso
- 💡 Tips de desarrollo

### Hot Reload

- ⚡ Cambios visuales: **Instantáneos** (1-2 seg)
- ⚡ Cambios de estilos: **Instantáneos**
- ⚡ Cambios de texto: **Instantáneos**
- ⚡ Cambios de layout: **Instantáneos**

---

## 💡 Casos de Uso

### Caso 1: Probar Diferentes Imágenes

```tsx
// RecuerdosWidget.tsx

// Cambiar fácilmente entre imágenes
const exampleImageUrl = "https://picsum.photos/800/600";
// const exampleImageUrl = 'https://images.unsplash.com/photo-...';
// const exampleImageUrl = 'TU_IMAGEN_AQUÍ';

// Guardar → Ver cambio instantáneo ⚡
```

### Caso 2: Ajustar Tamaños de Fuente

```tsx
// Probar diferentes tamaños
<TextWidget
  text="RECUERDOS RECIENTES"
  style={{
    fontSize: 11, // Prueba: 10, 11, 12, 13...
  }}
/>

// Guardar cada vez → Ver diferencia inmediata
```

### Caso 3: Experimentar con Colores

```tsx
// Probar diferentes combinaciones
<TextWidget
  text="Día en la playa"
  style={{
    color: '#FFFFFF',     // O '#FFD700', '#FF6B6B', etc
  }}
/>

// Probar overlay
<FlexWidget
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Cambiar opacidad
  }}
/>
```

### Caso 4: Ajustar Espaciado

```tsx
<FlexWidget
  style={{
    padding: 24,  // Prueba: 16, 20, 24, 28, 32
    gap: 6,       // Prueba: 4, 6, 8, 10
  }}
>
```

---

## 📊 Comparación: Con vs Sin Widget Preview

| Tarea             | Sin Preview       | Con Preview           |
| ----------------- | ----------------- | --------------------- |
| Cambiar color     | 3 min rebuild     | ⚡ **2 seg**          |
| Ajustar tamaño    | 3 min rebuild     | ⚡ **2 seg**          |
| Cambiar imagen    | 3 min rebuild     | ⚡ **2 seg**          |
| Modificar texto   | 3 min rebuild     | ⚡ **2 seg**          |
| Probar 10 cambios | **30 minutos** 😫 | ⚡ **20 segundos** 🎉 |

**Ahorro de tiempo: ~29 minutos por cada 10 cambios!**

---

## 🚀 Workflow Completo Recomendado

### Fase 1: Desarrollo (Widget Preview)

```
1. Abrir Widget Preview ✅
2. Hacer cambios en RecuerdosWidget.tsx ✅
3. Guardar → Ver cambios instantáneos ⚡
4. Repetir pasos 2-3 hasta que esté perfecto
5. Total: ~5-10 minutos para diseño completo
```

### Fase 2: Confirmación (Build Real)

```
6. Cuando estés 100% satisfecho:
   npx expo prebuild --platform android
   npx expo run:android

7. Agregar widget a home screen
8. Verificar que se ve igual al preview
9. ¡Listo! 🎉
```

**Total:** 5-10 min desarrollo + 5 min build = **~15 minutos**

Sin preview sería: **30-60 minutos** (múltiples rebuilds)

---

## ⚠️ Limitaciones del Preview

### Lo que SÍ funciona con hot reload:

- ✅ Cambios visuales (colores, tamaños, fuentes)
- ✅ Cambios de texto
- ✅ Cambios de layout
- ✅ Cambios de imágenes
- ✅ Cambios de estilos

### Lo que NO se puede previsualizar:

- ❌ Clicks en el widget (solo en widget real)
- ❌ Actualización automática (WorkManager)
- ❌ Deep linking
- ❌ Comportamiento cuando la app está cerrada

**Para estas features:** Necesitas hacer el build final y probar en el widget real.

---

## 🎨 Ejemplo de Sesión de Desarrollo

```
[12:00] Abres Widget Preview
[12:01] Cambias color del título a dorado
        → Guardas → Ves cambio instantáneo ⚡
[12:02] No te gusta, pruebas azul claro
        → Guardas → Ves cambio instantáneo ⚡
[12:03] Perfecto! Ahora cambias el tamaño a 26px
        → Guardas → Ves cambio instantáneo ⚡
[12:04] Ajustas el padding de 24 a 20
        → Guardas → Ves cambio instantáneo ⚡
[12:05] Cambias la imagen de ejemplo
        → Guardas → Ves cambio instantáneo ⚡
[12:06] Todo perfecto! Cierras el preview

[12:10] Ejecutas: npx expo run:android
[12:15] Build completado
[12:16] Agregas widget → ¡Se ve EXACTAMENTE como en el preview! 🎉
```

**Total: 16 minutos** (5 min iteración + 5 min build + 1 min agregar widget)

Sin preview hubiera sido: **35+ minutos** (7 rebuilds × 5 min cada uno)

---

## 💡 Tips Pro

### 1. Mantén el Preview Abierto

```
Split screen:
- Izquierda: Editor (RecuerdosWidget.tsx)
- Derecha: Preview (en el emulador/dispositivo)

Verás los cambios inmediatamente al guardar!
```

### 2. Usa Comentarios para Experimentar

```tsx
// Opción 1: Imagen de paisaje
const exampleImageUrl = "https://picsum.photos/800/600";

// Opción 2: Imagen de comida
// const exampleImageUrl = 'https://foodimages.com/...';

// Opción 3: Mi imagen custom
// const exampleImageUrl = 'https://mi-imagen.jpg';
```

Solo descomenta la que quieres probar → Guarda → ¡Ya!

### 3. Crea Variantes Rápidas

```tsx
// Variante oscura
const DARK_THEME = {
  labelColor: "#FFFFFF",
  titleColor: "#FFFFFF",
  overlayColor: "rgba(0, 0, 0, 0.7)",
};

// Variante clara
const LIGHT_THEME = {
  labelColor: "#333333",
  titleColor: "#000000",
  overlayColor: "rgba(255, 255, 255, 0.3)",
};

// Cambiar aquí
const CURRENT_THEME = DARK_THEME; // o LIGHT_THEME
```

### 4. Documenta tus Cambios

```tsx
// ✅ Probado: fontSize 24 funciona perfecto
// ❌ fontSize 28 es demasiado grande
// ⚠️ fontSize 20 es muy pequeño en pantallas grandes

<TextWidget
  style={{
    fontSize: 24, // ← Tamaño óptimo encontrado
  }}
/>
```

---

## 🎉 ¡Disfruta del Desarrollo Rápido!

Ya tienes configurado el **Widget Preview** completo. Ahora puedes:

✅ Desarrollar el widget **90% más rápido**  
✅ Ver cambios **instantáneamente**  
✅ Iterar **sin límites**  
✅ Hacer **rebuild solo una vez** al final

**¡Feliz desarrollo! 🚀**

---

## 🤝 ¿Necesitas Ayuda?

Si tienes problemas:

1. Verifica que estés en modo dev (`__DEV__` = true)
2. Asegúrate de tener la app corriendo (`npm run dev`)
3. El botón debe aparecer en Configuración
4. Si no aparece, reinicia la app

**¿Listo para empezar a diseñar tu widget?** 🎨
