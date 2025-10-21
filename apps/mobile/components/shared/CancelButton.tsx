import React from "react";
import { Button } from "react-native-paper";
import { STYLES } from "@/styles/base";

interface CancelButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
}

const CancelButton: React.FC<CancelButtonProps> = ({
  onPress,
  text = "Cancelar",
  disabled = false,
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
