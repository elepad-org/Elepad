import { registerWidgetTaskHandler } from "react-native-android-widget";
import { TaskWidget } from "./TaskWidget";

// Registrar el manejador del widget
registerWidgetTaskHandler(async (props) => {
  const widgetInfo = props.widgetInfo;

  // Aquí puedes obtener datos de tu API o AsyncStorage
  // Por ejemplo, obtener actividades pendientes del usuario

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      // Cuando el usuario agrega el widget a la pantalla de inicio
      console.log("Widget agregado:", widgetInfo);
      props.renderWidget(<TaskWidget />);
      break;

    case "WIDGET_UPDATE":
      // Cuando necesitas actualizar el contenido del widget
      console.log("Widget actualizado:", widgetInfo);
      props.renderWidget(<TaskWidget />);
      break;

    case "WIDGET_RESIZED":
      // Cuando el usuario redimensiona el widget
      console.log("Widget redimensionado:", widgetInfo);
      props.renderWidget(<TaskWidget />);
      break;

    case "WIDGET_DELETED":
      // Cuando el usuario elimina el widget
      console.log("Widget eliminado:", widgetInfo);
      // Aquí puedes hacer limpieza si es necesario
      break;

    case "WIDGET_CLICK":
      // Cuando el usuario hace click en el widget
      console.log("Widget clickeado:", widgetInfo);
      // Puedes abrir la app o una pantalla específica
      break;

    default:
      console.log("Acción de widget no manejada:", props.widgetAction);
      break;
  }
});
