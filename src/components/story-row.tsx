import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { Cover } from '@/components/cover';
import { Icon } from '@/components/icon';
import { useDownloads } from '@/data/downloads-provider';
import { BUNDLED_TEST_AUDIO, type Story } from '@/data/types';
import { colors, formatMinutes, spacing } from '@/theme';

type Props = {
  story: Story;
  onPress: () => void;
  /** 'download' = przycisk pobierania; 'delete' = przycisk usuwania z telefonu. */
  action: 'download' | 'delete';
};

export function StoryRow({ story, onPress, action }: Props) {
  const { downloaded, downloading, download, remove } = useDownloads();
  const isDownloaded = story.id in downloaded;
  const isDownloading = Boolean(downloading[story.id]);
  const isBundled = story.audioUrl === BUNDLED_TEST_AUDIO;

  const sizeBytes = downloaded[story.id] ?? story.sizeBytes;
  const meta = [formatMinutes(story.durationSec), sizeBytes ? `${Math.round(sizeBytes / 1_000_000)} MB` : null]
    .filter(Boolean)
    .join(' · ');

  const onDownload = () => {
    download(story).catch(() =>
      Alert.alert('Nie udało się pobrać', 'Sprawdź połączenie z internetem i spróbuj jeszcze raz.')
    );
  };

  const onDelete = () => {
    Alert.alert('Usunąć z telefonu?', `„${story.title}” będzie wymagać internetu, żeby ją odtworzyć.`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => remove(story.id) },
    ]);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Słuchaj: ${story.title}, ${formatMinutes(story.durationSec)}`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 10,
          minHeight: 64,
          opacity: pressed ? 0.6 : 1,
        })}>
        <Cover color={story.coverColor} width={56} height={56} radius={14} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{story.title}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{meta}</Text>
        </View>
      </Pressable>

      {action === 'download' && !isBundled && (
        <Pressable
          onPress={isDownloaded || isDownloading ? undefined : onDownload}
          disabled={isDownloaded || isDownloading}
          accessibilityRole="button"
          accessibilityLabel={isDownloaded ? 'Pobrana' : isDownloading ? 'Pobieranie' : `Pobierz: ${story.title}`}
          hitSlop={8}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          {isDownloading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Icon
              name={isDownloaded ? 'downloaded' : 'download'}
              color={isDownloaded ? colors.success : colors.textMuted}
              size={24}
            />
          )}
        </Pressable>
      )}

      {action === 'delete' && (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Usuń z pobranych: ${story.title}`}
          hitSlop={8}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="delete" color={colors.textMuted} size={22} />
        </Pressable>
      )}
    </View>
  );
}
