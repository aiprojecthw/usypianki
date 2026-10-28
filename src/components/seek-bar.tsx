import { useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';

import { Txt } from '@/components/txt';
import { usePalette } from '@/components/ui';
import { formatDuration } from '@/theme';

type Props = {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  /** Krok dla czytnika ekranu (gest w górę/w dół), w sekundach. */
  step: number;
};

const TOUCH_HEIGHT = 36;
const TRACK_HEIGHT = 6;
const THUMB = 16;

/**
 * Pasek postępu bajki, który można dotknąć albo przeciągnąć. Podczas przeciągania
 * pokazuje docelowy czas, a przewija dopiero po puszczeniu palca (jedno przewinięcie
 * zamiast dziesiątek, co przy strumieniu z internetu oszczędza buforowanie).
 */
export function SeekBar({ currentTime, duration, onSeek, step }: Props) {
  const palette = usePalette();
  const track = useRef<View>(null);
  const bounds = useRef({ x: 0, width: 1 });
  const [scrub, setScrub] = useState<number | null>(null);

  const canSeek = duration > 0;
  const shown = scrub ?? currentTime;
  const progress = canSeek ? Math.min(1, Math.max(0, shown / duration)) : 0;

  const timeAt = (pageX: number) => {
    const { x, width } = bounds.current;
    const ratio = Math.min(1, Math.max(0, (pageX - x) / width));
    return ratio * duration;
  };

  const onGrant = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    track.current?.measureInWindow((x, _y, width) => {
      bounds.current = { x, width: Math.max(1, width) };
      setScrub(timeAt(pageX));
    });
  };
  const onMove = (e: GestureResponderEvent) => setScrub(timeAt(e.nativeEvent.pageX));
  const onRelease = (e: GestureResponderEvent) => {
    const target = timeAt(e.nativeEvent.pageX);
    setScrub(null);
    onSeek(target);
  };

  return (
    <View style={{ width: '100%', gap: 4 }}>
      <View
        ref={track}
        style={{ height: TOUCH_HEIGHT, justifyContent: 'center' }}
        onStartShouldSetResponder={() => canSeek}
        onMoveShouldSetResponder={() => canSeek}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={() => setScrub(null)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Postęp bajki"
        accessibilityValue={{ text: `${formatDuration(currentTime)} z ${formatDuration(duration)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onSeek(currentTime + step);
          if (e.nativeEvent.actionName === 'decrement') onSeek(currentTime - step);
        }}>
        <View style={{ height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: palette.progressTrack }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              backgroundColor: palette.accent,
            }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            marginLeft: -THUMB / 2,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: palette.accent,
            transform: [{ scale: scrub !== null ? 1.4 : 1 }],
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt size={13} color={scrub !== null ? palette.text : palette.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(shown)}
        </Txt>
        <Txt size={13} color={palette.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(duration)}
        </Txt>
      </View>
    </View>
  );
}
