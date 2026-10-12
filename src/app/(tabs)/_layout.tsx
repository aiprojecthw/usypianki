import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.surfaceRaised}
      labelStyle={{ default: { color: colors.textMuted }, selected: { color: colors.text } }}
      iconColor={{ default: colors.textMuted, selected: colors.accent }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Bajki</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" md="auto_stories" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="downloads">
        <NativeTabs.Trigger.Label>Pobrane</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.down.circle" md="download" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
