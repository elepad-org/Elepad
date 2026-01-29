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
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          {...props}
        />
      </View>
    );
  },
);

StyledTextInput.displayName = "StyledTextInput";
