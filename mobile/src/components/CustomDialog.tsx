import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "destructive" | "default";
}

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: DialogButton[];
  onClose: () => void;
}

export function CustomDialog({ visible, title, message, buttons, onClose }: CustomDialogProps) {
  const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "default" as const }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.centered}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            {resolvedButtons.map((btn, i) => (
              <Pressable
                key={i}
                style={[
                  styles.button,
                  btn.style === "cancel" && styles.cancelButton,
                  btn.style === "destructive" && styles.destructiveButton,
                  btn.style === "default" && styles.defaultButton,
                  resolvedButtons.length === 1 && styles.fullWidthButton,
                ]}
                onPress={() => {
                  btn.onPress?.();
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === "cancel" && styles.cancelText,
                    btn.style === "destructive" && styles.destructiveText,
                    btn.style === "default" && styles.defaultText,
                  ]}
                >
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  fullWidthButton: {
    flex: undefined,
    width: "100%",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  destructiveButton: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  defaultButton: {
    backgroundColor: "#3B82F6",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cancelText: {
    color: "#374151",
  },
  destructiveText: {
    color: "#DC2626",
  },
  defaultText: {
    color: "#fff",
  },
});
