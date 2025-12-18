// Inicializador de widgets
// Este archivo se importa en _layout.tsx para registrar los widgets
import { Platform } from "react-native";

export function initializeWidgets() {
  // Solo en Android y solo en builds nativos (no en Expo Go)
  if (Platform.OS === "android") {
    try {
      // Importar el manejador de widgets
      require("./widgetTaskHandler");
      console.log("✅ Widgets de Elepad inicializados correctamente");
    } catch (error) {
      // Si falla (por ejemplo, en Expo Go), simplemente no hace nada
      console.log(
        "ℹ️ Widgets no disponibles en este build (probablemente Expo Go)"
      );
    }
  }
}
