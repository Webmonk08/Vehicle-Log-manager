import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#000000',
    secondary: '#22c55e',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceVariant: '#ebebeb',
    error: '#ef4444',
    onBackground: '#000000',
    onSurface: '#000000',
  },
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#ffffff',
    card: '#ffffff',
    text: '#000000',
    border: '#e5e5e5',
    primary: '#000000',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={navTheme}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="trip/[id]"
              options={{
                headerShown: true,
                title: 'Trip Details',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#000000',
              }}
            />
            <Stack.Screen
              name="driver/[id]"
              options={{
                headerShown: true,
                title: 'Driver Profile',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#000000',
              }}
            />
            <Stack.Screen
              name="vehicle/[id]"
              options={{
                headerShown: true,
                title: 'Vehicle Details',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#000000',
              }}
            />
            <Stack.Screen
              name="create-trip"
              options={{
                headerShown: true,
                title: 'New Trip',
                presentation: 'modal',
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#000000',
              }}
            />
          </Stack>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
