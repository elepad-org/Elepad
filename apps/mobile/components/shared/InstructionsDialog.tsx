import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Dialog, Text, IconButton } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface InstructionsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
}

export const InstructionsDialog: React.FC<InstructionsDialogProps> = ({
  visible,
  onDismiss,
  title,
  children,
}) => {
  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
          iconColor={COLORS.textSecondary}
          style={styles.closeButton}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {children}
      </ScrollView>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: COLORS.background,
    width: "90%",
    alignSelf: "center",
    borderRadius: 16,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: "bold",
    color: COLORS.primary,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    maxHeight: 500,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
