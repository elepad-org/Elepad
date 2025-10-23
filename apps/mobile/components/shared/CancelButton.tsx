import { Button } from "react-native-paper";
import { STYLES } from "@/styles/base";

const CancelButton = ({
  onPress,
  text = "Cancelar",
  disabled = false,
}: {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
}) => {
  return (
    <Button
      style={{
        ...STYLES.miniButton,
        alignSelf: "center",
        paddingVertical: 2,
      }}
      labelStyle={{
        color: "#ffffff",
      }}
      onPress={onPress}
      disabled={disabled}
    >
      {text}
    </Button>
  );
};

export default CancelButton;
