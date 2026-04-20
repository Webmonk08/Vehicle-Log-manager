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
    primary: '#2563EB',
    secondary: '#10B981',
    background: '#0A1628',
    surface: '#111D33',
    surfaceVariant: '#162240',
    error: '#EF4444',
    onBackground: '#F1F5F9',
    onSurface: '#F1F5F9',
  },
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A1628',
    card: '#111D33',
    text: '#F1F5F9',
    border: '#1E3A5F',
    primary: '#2563EB',
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
          <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="trip/[id]"
              options={{
                headerShown: true,
                title: 'Trip Details',
                headerStyle: { backgroundColor: '#111D33' },
                headerTintColor: '#F1F5F9',
              }}
            />
            <Stack.Screen
              name="driver/[id]"
              options={{
                headerShown: true,
                title: 'Driver Profile',
                headerStyle: { backgroundColor: '#111D33' },
                headerTintColor: '#F1F5F9',
              }}
            />
            <Stack.Screen
              name="vehicle/[id]"
              options={{
                headerShown: true,
                title: 'Vehicle Details',
                headerStyle: { backgroundColor: '#111D33' },
                headerTintColor: '#F1F5F9',
              }}
            />
            <Stack.Screen
              name="create-trip"
              options={{
                headerShown: true,
                title: 'New Trip',
                presentation: 'modal',
                headerStyle: { backgroundColor: '#111D33' },
                headerTintColor: '#F1F5F9',
              }}
            />
          </Stack>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
