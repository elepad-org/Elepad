import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface SudokuCellProps {
  value: number | null;
  isReadOnly: boolean;
  isError: boolean;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
}

export const SudokuCell: React.FC<SudokuCellProps> = ({
  value,
  isReadOnly,
  isError,
  isSelected,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.cell,
        isSelected && styles.cellSelected,
        isError && styles.cellError,
        isReadOnly && styles.cellReadOnly,
      ]}
    >
      {value !== null && (
        <Text
          style={[
            styles.cellText,
            isReadOnly && styles.cellTextReadOnly,
            isError && styles.cellTextError,
          ]}
        >
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    height: "100%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cellSelected: {
    backgroundColor: "#E3F2FD", // Light blue
    borderColor: COLORS.primary,
  },
  cellError: {
    backgroundColor: "#FFEBEE", // Light red
    borderColor: COLORS.error,
  },
  cellReadOnly: {
    backgroundColor: "#F5F5F5", // Light gray
  },
  cellText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
    lineHeight: 24,
  },
  cellTextReadOnly: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  cellTextError: {
    color: COLORS.error,
  },
});
