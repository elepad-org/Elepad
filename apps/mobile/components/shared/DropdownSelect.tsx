import { useState, useRef } from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/styles/base";
import PickerModal from "./PickerModal";

interface DropdownOption {
  key: string;
  label: string;
  icon?: string;
  avatarUrl?: string | null;
  frameUrl?: string | null;
}

interface DropdownSelectProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: object;
  showLabel?: boolean;
  buttonStyle?: object;
}

export default function DropdownSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = "Seleccionar...",
  disabled = false,
  style = {},
  showLabel = true,
  buttonStyle = {},
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<
    { top: number; left: number; width: number } | undefined
  >();
  const buttonRef = useRef<View>(null);

  const selectedOption = options.find((option) => option.key === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleOpen = () => {
    if (disabled) return;
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setAnchorPosition({
        top: pageY + height,
        left: pageX,
        width: width,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (option: { id: string; label: string }) => {
    onSelect(option.id);
    setIsOpen(false);
  };

  return (
    <View style={{ position: "relative", ...style }}>
      {/* Label */}
      {showLabel && (
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
      )}

      {/* Button Trigger */}
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          onPress={handleOpen}
          disabled={disabled}
          style={[localStyles.button, buttonStyle]}
        >
          <View style={localStyles.buttonContent}>
            {selectedOption?.icon ? (
              <View style={localStyles.iconContainer}>
                <MaterialCommunityIcons
                  name={selectedOption.icon as never}
                  size={20}
                  color={COLORS.primary}
                />
              </View>
            ) : selectedOption?.avatarUrl ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: selectedOption.avatarUrl }}
                  style={localStyles.avatar}
                />
                {selectedOption.frameUrl && (
                  <Image
                    source={{ uri: selectedOption.frameUrl }}
                    style={{
                      position: "absolute",
                      width: 32 * 1.4,
                      height: 32 * 1.4,
                      top: -32 * 0.2,
                      left: -32 * 0.2,
                      zIndex: 10,
                    }}
                    resizeMode="contain"
                  />
                )}
              </View>
            ) : selectedOption ? (
              <View style={localStyles.initialContainer}>
                <Text style={localStyles.initialText}>
                  {selectedOption.label.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : null}
            <Text
              style={[
                localStyles.buttonText,
                selectedOption
                  ? localStyles.buttonTextSelected
                  : localStyles.buttonTextPlaceholder,
              ]}
            >
              {displayText}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      <PickerModal
        visible={isOpen}
        title={`${label}:`}
        options={options.map((option) => ({
          id: option.key,
          label: option.label,
          avatarUrl: option.avatarUrl,
          frameUrl: option.frameUrl,
          icon: option.icon ? (
            <MaterialCommunityIcons
              name={option.icon as never}
              size={20}
              color={COLORS.primary}
            />
          ) : undefined,
          // We can't easily wrap the PickerModal items here without modifying PickerModal
          // But if PickerModal renders a FlatList or Map, we should animate there.
          // Since I cannot see PickerModal, I will try to animate the content if I can.
          // Wait, DropdownSelect just passes options to PickerModal.
          // I need to View PickerModal to animate the items.
        }))}
        onSelect={handleSelect}
        onDismiss={() => setIsOpen(false)}
        anchorPosition={anchorPosition}
        maxHeight={300}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  initialContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonText: {
    fontSize: 16,
    flex: 1,
  },
  buttonTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  buttonTextPlaceholder: {
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
