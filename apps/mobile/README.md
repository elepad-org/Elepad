# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Sistema de Estilos Simplificado

La app usa un **sistema de estilos minimalista** para mantener consistencia visual y reducir duplicación de código. El objetivo es tener **pocas opciones** para que el equipo tenga menos decisiones que tomar.

### 🎨 Archivo Principal: `/styles/base.ts`

Este archivo contiene **SOLO** los estilos esenciales:

#### Colores (Solo los necesarios):

- `COLORS.primary` - Color principal azul
- `COLORS.secondary` - Botones principales
- `COLORS.background` - Fondo general
- `COLORS.loginBackground` - Fondo de login
- `COLORS.white` - Blanco
- `COLORS.text` - Texto principal
- `COLORS.textSecondary` - Texto secundario
- `COLORS.textLight` - Texto claro

#### Estilos Base (Minimalistas):

- **Layouts**: `safeArea`, `safeAreaLogin`, `container`, `center`
- **Tarjetas**: `card`
- **Botones**: `buttonPrimary`, `buttonSecondary`, `buttonGoogle`, `buttonContent`
- **Inputs**: `input`, `inputOutline`
- **Textos**: `heading`, `subheading`, `footerText`
- **Logo**: `logoWrap`, `logo`, `brand`, `brandMedium`
- **Headers**: `headerPrimary`, `welcomeGreeting`, `headerTitle`
- **Desarrollo**: `developmentContainer`, `developmentCard`, `developmentTitle`

### 🔧 Cómo usar en componentes:

```typescript
import { COLORS, styles } from "@/styles/base";

export default function MiPantalla() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Mi Título</Text>
        <Button style={styles.buttonPrimary}>Mi Botón</Button>
      </View>
    </SafeAreaView>
  );
}
```

### ✅ Beneficios:

1. **Menos decisiones**: Solo hay 1-2 opciones para cada elemento
2. **Consistencia garantizada**: Todos usan los mismos estilos
3. **Código limpio**: No hay StyleSheet.create() en cada componente
4. **Fácil mantenimiento**: Cambios centralizados
5. **Visual idéntico**: Se mantiene la apariencia exacta

### 🚫 Evita:

- Crear estilos locales en componentes
- Usar colores hardcodeados como "#7fb3d3"
- Duplicar estilos entre pantallas## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
