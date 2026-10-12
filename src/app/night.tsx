import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { usePlayer } from '@/player/player-provider';
import { colors } from '@/theme';

// Prawie czarny ekran: minimum światła w sypialni, jeden duży przycisk.
export default function NightScreen() {
  const { story, playing, secondsLeft, toggle } = usePlayer();
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60));

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Wróć do odtwarzacza"
      style={{ flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', gap: 28, padding: 40 }}>
      {story && <Text style={{ color: colors.nightText, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{story.title}</Text>}
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pauza' : 'Odtwórz'}
        style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: '#262338', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={playing ? 'pause' : 'play'} size={44} color={colors.nightButton} />
      </Pressable>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ color: colors.nightText, fontSize: 15 }}>
          {playing ? `Zostało ${minutes} min · potem cisza` : 'Wstrzymano'}
        </Text>
        <Text style={{ color: '#4A4563', fontSize: 13 }}>Dotknij ekranu, aby wrócić</Text>
      </View>
    </Pressable>
  );
}
