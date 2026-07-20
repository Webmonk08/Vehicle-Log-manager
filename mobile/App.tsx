import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "@/navigation/RootNavigator";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <OfflineBanner />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
