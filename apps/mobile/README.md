# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Style System

The app uses a shared style system to maintain visual consistency and reduce code duplication across screens. The shared style system includes:

### 1. Theme Constants

Located in `/styles/theme.ts`, this file contains:

- Font family definitions
- Theme colors for light and dark modes

### 2. Shared Styles

Located in `/styles/shared.ts`, this file contains:

- Common color definitions with semantic naming
- Spacing constants for consistent layout
- Border radius constants
- Shadow utilities
- Reusable style objects for common UI elements like:
  - Layout containers (safeArea, container, footer)
  - Cards and sections
  - Buttons
  - Text styles
  - Form elements
  - List items and member displays

### How to Use Shared Styles

1. Import the necessary styles in your component:

   ```typescript
   import { COLORS, commonStyles } from "@/styles/shared";
   import { FONT } from "@/styles/theme";
   ```

2. Use the shared styles in your component's StyleSheet:

   ```typescript
   const styles = StyleSheet.create({
     // Include all common styles
     ...commonStyles,

     // Override specific styles or add component-specific styles
     container: {
       ...commonStyles.container,
       backgroundColor: COLORS.background,
     },

     // Add new styles specific to this component
     myCustomStyle: {
       // ...
     },
   });
   ```

3. When referencing colors, use the COLORS constant:
   ```typescript
   <View style={{ backgroundColor: COLORS.primary }} />
   ```

By using this shared style system, we maintain visual consistency across the app while reducing code duplication.

## Get started

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
