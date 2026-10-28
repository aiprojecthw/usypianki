import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { CatalogProvider } from '@/data/catalog-provider';
import { DownloadsProvider } from '@/data/downloads-provider';
import { PurchaseProvider } from '@/data/purchase-provider';
import { SettingsProvider, useSettings } from '@/data/settings-provider';
import { PlayerProvider } from '@/player/player-provider';
import { palettes, parent } from '@/theme';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { daypart } = useSettings();
  const palette = palettes[daypart];
  const theme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, primary: palette.accent, background: palette.background, card: palette.background },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={daypart === 'day' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="stories" />
        <Stack.Screen
          name="timer"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: 'fitToContents',
            sheetGrabberVisible: true,
            contentStyle: { backgroundColor: parent.surface },
          }}
        />
        <Stack.Screen name="gate" options={{ contentStyle: { backgroundColor: parent.background } }} />
        <Stack.Screen name="parent" options={{ contentStyle: { backgroundColor: parent.background } }} />
        <Stack.Screen name="purchase" options={{ contentStyle: { backgroundColor: parent.background } }} />
        <Stack.Screen name="manage-downloads" options={{ contentStyle: { backgroundColor: parent.background } }} />
        <Stack.Screen name="about" options={{ contentStyle: { backgroundColor: parent.background } }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SettingsProvider>
      <PurchaseProvider>
      <CatalogProvider>
        <DownloadsProvider>
          <PlayerProvider>
            <AppStack />
          </PlayerProvider>
        </DownloadsProvider>
      </CatalogProvider>
      </PurchaseProvider>
    </SettingsProvider>
  );
}
