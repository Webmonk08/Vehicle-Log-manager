import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "@/navigation/RootNavigator";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SplashScreen } from "@/screens/Splash/SplashScreen";

const queryClient = new QueryClient();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  if (!isAppReady) {
    return <SplashScreen onFinish={() => setIsAppReady(true)} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <StatusBar style="dark" />
          <OfflineBanner />
          <RootNavigator />
        </KeyboardAvoidingView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
