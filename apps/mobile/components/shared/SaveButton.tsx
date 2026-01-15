import { Button } from "react-native-paper";
import { COLORS } from "@/styles/base";

const SaveButton = ({
  onPress,
  text = "Guardar",
  disabled = false,
  loading = false,
}: {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
}) => {
  return (
    <Button
      mode="contained"
      style={{
        borderRadius: 12,
        width: "100%",
      }}
      buttonColor={COLORS.primary}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
    >
      {text}
    </Button>
  );
};

export default SaveButton;
