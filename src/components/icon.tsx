import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type AndroidName = Extract<ComponentProps<typeof SymbolView>['name'], { android?: unknown }>['android'];
type IosName = Extract<ComponentProps<typeof SymbolView>['name'], { ios?: unknown }>['ios'];

// Standardowe ikony sterowania (pauza, przewijanie) zostają systemowe — tak ustalono
// w makiecie; ilustrowane ikony są w src/ui/media.ts.
const icons = {
  play: { android: 'play_arrow', ios: 'play.fill' },
  pause: { android: 'pause', ios: 'pause.fill' },
  replay: { android: 'replay', ios: 'gobackward' },
  forward: { android: 'forward_media', ios: 'goforward' },
  check: { android: 'check', ios: 'checkmark' },
  delete: { android: 'delete', ios: 'trash' },
  chevronRight: { android: 'chevron_right', ios: 'chevron.right' },
  close: { android: 'arrow_back', ios: 'chevron.left' },
  done: { android: 'check_circle', ios: 'checkmark.circle.fill' },
  minus: { android: 'remove', ios: 'minus' },
  plus: { android: 'add', ios: 'plus' },
  backspace: { android: 'backspace', ios: 'delete.left' },
} satisfies Record<string, { android: AndroidName; ios: IosName }>;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
