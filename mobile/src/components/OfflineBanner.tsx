import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export function OfflineBanner() {
  const isOffline = useOfflineStatus();
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline — viewing cached data. Changes are disabled until reconnected.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: "#FEF3C7", paddingVertical: 6, alignItems: "center" },
  text: { color: "#92400E", fontSize: 12, fontWeight: "600" },
});
