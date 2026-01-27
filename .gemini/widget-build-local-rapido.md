# 🚀 Guía Rápida: Build Local del Widget (2-5 minutos)

## ❌ Problema: EAS Build tarda 6+ horas

## ✅ Solución: Build local en tu PC

---

## 📋 Pasos Exactos

### 1️⃣ Limpiar Todo

```powershell
cd C:\Users\Noxie\Desktop\Proyectos\Elepad\apps\mobile

# Borrar carpeta android si existe
if (Test-Path android) { Remove-Item -Recurse -Force android }

# Borrar node_modules del widget (pueden causar problemas)
if (Test-Path node_modules\react-native-android-widget) {
  Remove-Item -Recurse -Force node_modules\react-native-android-widget
}
```

---

### 2️⃣ Reinstalar Dependencias

```powershell
# Desde apps/mobile
npm install
```

---

### 3️⃣ Prebuild (Sin --clean)

```powershell
npx expo prebuild --platform android
```

**Si pregunta "Apply changes?"** → Responde **Y** (Yes)

**Tiempo:** ~1-2 minutos

---

### 4️⃣ Arreglar el Error de Gradle (Si aparece)

Si ves el error `Error resolving plugin [id: 'com.facebook.react.settings']`:

#### **Opción A: Actualizar React Native Gradle Plugin**

Edita `android/build.gradle`:

```gradle
buildscript {
  dependencies {
    // Cambiar esta línea:
    classpath('com.facebook.react:react-native-gradle-plugin')

    // Por esta (con versión específica):
    classpath('com.facebook.react:react-native-gradle-plugin:0.81.5')
  }
}
```

#### **Opción B: Desde la terminal**

```powershell
cd android
./gradlew clean
cd ..
```

---

### 5️⃣ Conectar tu Dispositivo Android

**Opción A: Via USB**

1. Conecta tu Android al PC con cable USB
2. Activa "Depuración USB" en el celular:
   - Ajustes → Acerca del teléfono → Tap 7 veces en "Número de compilación"
   - Ajustes → Opciones de desarrollador → Depuración USB (activar)
3. Acepta el popup de autorización en el celular

**Verificar conexión:**

```powershell
adb devices
```

Deberías ver algo como:

```
List of devices attached
ZY22GPDG5K    device
```

**Opción B: Emulador**

Si no tienes cable o prefieres emulador:

1. Abre Android Studio
2. AVD Manager → Create Virtual Device
3. Elige cualquier dispositivo (ej: Pixel 6)
4. Elige Android 13 o 14
5. Finish → Start emulator

---

### 6️⃣ Build y Deploy (¡AUTOMÁTICO!)

```powershell
npx expo run:android
```

**Esto hará:**

1. ✅ Compila el código nativo (incluyendo el widget)
2. ✅ Genera el APK
3. ✅ Instala en tu dispositivo/emulador
4. ✅ Inicia la app automáticamente
5. ✅ Conecta al Metro bundler

**Tiempo primera vez:** 5-10 minutos  
**Tiempo siguientes veces:** 2-3 minutos

---

### 7️⃣ Probar el Widget

Una vez que la app esté corriendo:

1. **Minimiza la app**
2. **Long press** en cualquier espacio de la home screen
3. **Tap "Widgets"**
4. **Busca "Elepad"** o **"Recuerdos Recientes"**
5. **Arrastra el widget** a la home screen
6. **¡Listo!** 🎉

---

## 🔥 Comandos Rápidos Resumidos

```powershell
# Todo de una vez (copia y pega)
cd C:\Users\Noxie\Desktop\Proyectos\Elepad\apps\mobile
if (Test-Path android) { Remove-Item -Recurse -Force android }
npx expo prebuild --platform android
npx expo run:android
```

**Nota:** Si pregunta algo, responde **Y** (yes)

---

## ⚡ Si Hay Errores

### Error: "No Android device found"

```powershell
# Verificar que el dispositivo está conectado
adb devices

# Si no aparece, reiniciar adb
adb kill-server
adb start-server
adb devices
```

### Error: "JAVA_HOME not set"

```powershell
# Verificar Java
java -version

# Si no está instalado, descarga e instala:
# https://adoptium.net/
```

### Error: "Android SDK not found"

Necesitas instalar Android Studio:

1. Descarga: https://developer.android.com/studio
2. Instala normalmente
3. Abre Android Studio → More Actions → SDK Manager
4. Install Android SDK Platform (API 33 o 34)

### Error de Gradle persistente

```powershell
# Limpiar cache de Gradle
cd android
./gradlew clean
cd ..

# Borrar cache global
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches

# Volver a intentar
npx expo run:android
```

---

## 🎯 Ventajas del Build Local

| Feature                 | EAS Build            | Build Local         |
| ----------------------- | -------------------- | ------------------- |
| ⏱️ Tiempo (primera vez) | 10-15 min            | 5-10 min            |
| ⏱️ Tiempo (subsecuente) | 10-15 min            | **2-3 min** ⚡      |
| 🌐 Requiere internet    | ✅ Sí                | ⚠️ Solo primera vez |
| 💻 Requiere setup       | ❌ No                | ✅ Android SDK      |
| 🔧 Control total        | ❌ No                | ✅ Sí               |
| 💰 Costo                | Limitado (plan free) | ✅ Gratis ilimitado |

---

## 📱 Desarrollo Iterativo Rápido

Una vez que tienes el build inicial:

**Para cambios en la APP (JavaScript):**

```powershell
# No necesitas rebuild, solo:
npm run dev
# Hot reload funciona normal ⚡
```

**Para cambios en el WIDGET:**

```powershell
# Rebuild rápido (2-3 min):
npx expo run:android

# O solo recompilar:
cd android
./gradlew assembleDebug
cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎉 Checklist Final

- [ ] Android SDK instalado (via Android Studio)
- [ ] Dispositivo conectado o emulador corriendo
- [ ] `adb devices` muestra el dispositivo
- [ ] Carpeta `android` limpia
- [ ] `npx expo prebuild` completado sin errores
- [ ] `npx expo run:android` compilando...
- [ ] App instalada y corriendo
- [ ] Widget visible en la lista de widgets
- [ ] Widget agregado a la home screen
- [ ] ✅ ¡FUNCIONA! 🎊

---

## 💡 Siguientes Pasos

Una vez que el widget esté funcionando:

1. **Modifica** `RecuerdosWidget.tsx`
2. **Guarda** los cambios
3. **Rebuild rápido:**
   ```powershell
   npx expo run:android
   ```
4. **El widget se actualiza** automáticamente

**Ciclo de desarrollo:** Cambio → Save → Build (2-3 min) → Ver resultado

---

## 🆘 ¿Problemas?

Si algo no funciona:

1. Comparte el error exacto que ves
2. Corre `npx expo-doctor` para diagnosticar
3. Verifica que Android Studio esté bien instalado
4. Prueba con un emulador en vez de dispositivo físico

---

**¡Con build local deberías tener el widget funcionando en menos de 10 minutos!** 🚀
