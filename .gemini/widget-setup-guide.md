# 🚀 Guía de Implementación del Widget de Recuerdos

## ✅ Pasos Completados

1. ✅ Instalada la librería `react-native-android-widget`
2. ✅ Configurado `app.json` con el plugin del widget
3. ✅ Creado el componente `RecuerdosWidget.tsx`
4. ✅ Creado el `widgetTaskHandler.ts`
5. ✅ Registrado el widget en `app/_layout.tsx`

---

## 📋 Próximos Pasos (Manual)

### Paso 1: Generar Código Nativo

Ejecuta este comando en la terminal (dentro de `apps/mobile`):

```bash
npx expo prebuild --platform android
```

**Nota:** Este comando generará la carpeta `android/` con el código nativo necesario.

**Si te pregunta algo durante el proceso:**

- Name: Elepad
- Bundle identifier: com.elepadorg.elepad (ya está configurado)

---

### Paso 2: Ejecutar la App en Modo Dev

Después del prebuild, ya NO puedes usar `expo start --go`. Debes usar:

```bash
npx expo run:android
```

Este comando:

1. Compilará el código nativo (incluido el widget)
2. Instalará la app en tu dispositivo/emulador
3. Inicia el servidor Metro para hot-reload

**Primera vez puede tomar 5-10 minutos en compilar.**

---

### Paso 3: Agregar el Widget a la Home Screen

Una vez que la app esté corriendo:

1. **Long-press** en cualquier espacio vacío de la home screen
2. Selecciona **"Widgets"** en el menú
3. Busca **"Elepad"** o **"Recuerdos Recientes"**
4. **Arrastra** el widget a la home screen
5. **Estira** el widget para que ocupe el ancho completo

---

## 🎨 Resultado Esperado

Deberías ver un widget que:

- ✅ Ocupa todo el ancho de la pantalla (edge to edge)
- ✅ Tiene 280dp de alto (tamaño fijo)
- ✅ Muestra una imagen de paisaje hermosa SIN compresión
- ✅ Tiene un gradiente oscuro sobre la imagen
- ✅ Muestra 5 dots en la parte superior derecha (1 activo, 4 inactivos)
- ✅ Muestra texto en la parte inferior:
  - "RECUERDOS RECIENTES" (label)
  - "Día en la playa con la familia" (título)
  - "Un hermoso día soleado..." (descripción)
  - "15 de enero de 2026" (fecha)

---

## 🔧 Verificación de Problemas Visuales

### ¿La imagen se comprime/deforma?

Verifica que en el XML generado (`android/app/src/main/res/xml/recuerdos_widget_info.xml`):

```xml
<appwidget-provider
    android:minWidth="match_parent"
    android:minHeight="280dp"
    android:resizeMode="none">
</appwidget-provider>
```

### ¿El widget no ocupa todo el ancho?

1. Cuando agregues el widget, **arrastra los bordes** para expandirlo horizontalmente
2. Verifica que `targetCellWidth` sea 4 o más en `app.json`

---

## 🐛 Resolución de Problemas

### Error: "Plugin not found"

```bash
# Limpiar cache y reinstalar
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### El widget no aparece en la lista

```bash
# Desinstalar la app completamente del dispositivo
adb uninstall com.elepadorg.elepad

# Volver a compilar
npx expo run:android
```

### Error al compilar

```bash
# Limpiar build de Android
cd android
./gradlew clean
cd ..
npx expo run:android
```

---

## 📱 Comandos Útiles

```bash
# Ver logs del widget
adb logcat | grep "Widget"

# Ver información de widgets instalados
adb shell dumpsys activity widgets

# Reinstalar la app rápidamente
npx expo run:android --no-build-cache

# Ver estructura de archivos generados
tree android/app/src/main/res/xml
```

---

## 🎯 Próximas Mejoras (Una vez funcione el básico)

1. **Rotar entre recuerdos reales** (reemplazar la imagen de ejemplo)
2. **Auto-actualización cada 8 segundos**
3. **Deep linking** (al tocar el widget, abrir ese recuerdo)
4. **Sincronización con Supabase**
5. **Animaciones de transición**

---

## 📝 Notas Importantes

- **NO uses Expo Go:** El widget requiere código nativo
- **Compila en cada cambio:** Los cambios en el widget requieren recompilar (`npx expo run:android`)
- **Hot Reload:** Solo funciona para la app, no para el widget
- **Testing:** Prueba en dispositivo real para mejor experiencia

---

## ✨ Estado Actual

El widget base está **100% configurado y listo**. Solo falta:

1. Ejecutar `npx expo prebuild --platform android`
2. Ejecutar `npx expo run:android`
3. Agregar el widget a la home screen

**¿Quieres que te ayude con algo específico de estos pasos?**
