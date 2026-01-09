import { useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/base";
import PickerModal from "./PickerModal";

interface DropdownOption {
  key: string;
  label: string;
  icon?: string;
}

interface DropdownSelectProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: object;
}

export default function DropdownSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Seleccionar...",
  disabled = false,
  style = {},
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.key === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (option: { id: string; label: string }) => {
    onSelect(option.id);
    setIsOpen(false);
  };

  return (
    <View style={{ position: "relative", ...style }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: COLORS.textSecondary,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      {/* Button Trigger */}
      <Button
        mode="outlined"
        onPress={() => !disabled && setIsOpen(true)}
        style={{
          borderColor: COLORS.border,
          borderRadius: 8,
          justifyContent: "flex-start",
        }}
        contentStyle={{ 
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          paddingVertical: 4,
        }}
        icon="chevron-down"
        disabled={disabled}
        labelStyle={{
          color: selectedOption ? COLORS.text : COLORS.textSecondary,
          fontSize: 16,
          fontWeight: "500",
        }}
      >
        {displayText}
      </Button>

      {/* Picker Modal */}
      <PickerModal
        visible={isOpen}
        title={`${label}:`}
        options={options.map(option => ({
          id: option.key,
          label: option.label,
          icon: option.icon ? (
            <View style={{ marginRight: 12 }}>
              <MaterialCommunityIcons
                name={option.icon as any}
                size={24}
                color={value === option.key ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
          ) : undefined
        }))}
        onSelect={handleSelect}
        onDismiss={() => setIsOpen(false)}
        maxHeight={300}
      />
    </View>
  );
}
