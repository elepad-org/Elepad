import { Button } from "react-native-paper";
import { COLORS } from "@/styles/base";

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
      mode="outlined"
      style={{
        borderRadius: 12,
        borderColor: COLORS.primary,
        width: "100%",
      }}
      textColor={COLORS.primary}
      onPress={onPress}
      disabled={disabled}
    >
      {text}
    </Button>
  );
};

export default CancelButton;
