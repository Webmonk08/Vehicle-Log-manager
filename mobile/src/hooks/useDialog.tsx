import React from "react";
import { CustomDialog, type DialogButton } from "@/components/CustomDialog";

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
}

const INITIAL_STATE: DialogState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export function useDialog() {
  const [dialog, setDialog] = React.useState<DialogState>(INITIAL_STATE);

  const hideDialog = () => setDialog(INITIAL_STATE);

  const showAlert = (title: string, message: string) => {
    setDialog({ visible: true, title, message, buttons: [{ text: "OK", style: "default" }] });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      visible: true,
      title,
      message,
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", style: "default", onPress: onConfirm },
      ],
    });
  };

  const showDeleteConfirm = (title: string, message: string, onDelete: () => void) => {
    setDialog({
      visible: true,
      title,
      message,
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    });
  };

  const Dialog = () => (
    <CustomDialog
      visible={dialog.visible}
      title={dialog.title}
      message={dialog.message}
      buttons={dialog.buttons}
      onClose={hideDialog}
    />
  );

  return { Dialog, showAlert, showConfirm, showDeleteConfirm, hideDialog };
}
