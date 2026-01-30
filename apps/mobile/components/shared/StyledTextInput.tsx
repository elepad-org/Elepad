import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { TextInput, TextInputProps } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface StyledTextInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  marginBottom?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StyledTextInput = React.forwardRef<any, StyledTextInputProps>(
  (
    {
      style,
      containerStyle,
      backgroundColor = COLORS.backgroundSecondary,
      marginBottom = 0,
      mode = "flat",
      ...props
    },
    ref,
  ) => {
    return (
      <View
        style={[
          {
            backgroundColor,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom,
          },
          containerStyle,
        ]}
      >
        <TextInput
          ref={ref}
          mode={mode}
          style={[{ backgroundColor: "transparent" }, style]}
          outlineColor="transparent"
          activeOutlineColor="transparent"
          theme={{
            colors: {
              primary: COLORS.primary,
              background: "transparent",
              onSurfaceVariant: COLORS.primary,
              placeholder: COLORS.textSecondary,
            },
          }}
          selectionColor={COLORS.primary}
          cursorColor={COLORS.primary}
          {...props}
        />
      </View>
    );
  },
);

StyledTextInput.displayName = "StyledTextInput";
