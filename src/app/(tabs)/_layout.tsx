import { Image } from 'expo-image';
import Tabs from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { usePalette } from '@/components/ui';
import { uiIcons } from '@/ui/media';

const TAB_META: Record<string, { label: string; icon: number }> = {
  index: { label: 'Bajki', icon: uiIcons.book as number },
  downloads: { label: 'Pobrane', icon: uiIcons.basket as number },
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

/** Dolne menu z ilustrowanymi ikonami (książka, koszyk), kolory wg pory dnia. */
function IllustratedTabBar({ state, navigation }: TabBarProps) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 76 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: palette.navBackground,
        borderTopWidth: 1,
        borderTopColor: palette.navBorder,
      }}>
      {state.routes.map((route, i) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const active = state.index === i;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={meta.label}
            style={{ minWidth: 88, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <View
              style={{
                paddingHorizontal: 18,
                paddingVertical: 2,
                borderRadius: 16,
                backgroundColor: active ? palette.navActive : 'transparent',
              }}>
              <Image
                source={meta.icon}
                style={{ width: 30, height: 30, opacity: active ? 1 : 0.55 }}
                contentFit="contain"
              />
            </View>
            <Txt weight={active ? 'extrabold' : 'semibold'} size={12} color={active ? palette.text : palette.textMuted}>
              {meta.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <IllustratedTabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" options={{ title: 'Bajki' }} />
      <Tabs.Screen name="downloads" options={{ title: 'Pobrane' }} />
    </Tabs>
  );
}
