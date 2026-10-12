import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

import { colors } from '@/theme';

type AndroidName = Extract<ComponentProps<typeof SymbolView>['name'], { android?: unknown }>['android'];
type IosName = Extract<ComponentProps<typeof SymbolView>['name'], { ios?: unknown }>['ios'];

// Jedno miejsce mapujące ikony: Material Symbols na Androidzie, SF Symbols na iOS.
const icons = {
  play: { android: 'play_arrow', ios: 'play.fill' },
  pause: { android: 'pause', ios: 'pause.fill' },
  back10: { android: 'replay_10', ios: 'gobackward.10' },
  forward10: { android: 'forward_10', ios: 'goforward.10' },
  timer: { android: 'timer', ios: 'timer' },
  moon: { android: 'bedtime', ios: 'moon' },
  download: { android: 'download', ios: 'arrow.down.circle' },
  downloaded: { android: 'check_circle', ios: 'checkmark.circle.fill' },
  delete: { android: 'delete', ios: 'trash' },
  offline: { android: 'wifi_off', ios: 'wifi.slash' },
  back: { android: 'arrow_back', ios: 'chevron.left' },
  info: { android: 'info', ios: 'info.circle' },
  check: { android: 'check', ios: 'checkmark' },
  stories: { android: 'auto_stories', ios: 'book' },
} satisfies Record<string, { android: AndroidName; ios: IosName }>;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 24, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
