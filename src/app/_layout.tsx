import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { CatalogProvider } from '@/data/catalog-provider';
import { DownloadsProvider } from '@/data/downloads-provider';
import { PlayerProvider } from '@/player/player-provider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <CatalogProvider>
        <DownloadsProvider>
          <PlayerProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="player" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen
                name="timer"
                options={{
                  presentation: 'formSheet',
                  sheetAllowedDetents: 'fitToContents',
                  sheetGrabberVisible: true,
                  contentStyle: { backgroundColor: colors.surface },
                }}
              />
              <Stack.Screen
                name="night"
                options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: colors.night } }}
              />
              <Stack.Screen name="about" options={{ headerShown: true, title: 'O aplikacji' }} />
            </Stack>
          </PlayerProvider>
        </DownloadsProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}
