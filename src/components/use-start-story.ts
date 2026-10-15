import { useNetworkState } from 'expo-network';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { useDownloads } from '@/data/downloads-provider';
import { isBundled, type Story } from '@/data/types';
import { usePlayer } from '@/player/player-provider';

/** Uruchamia bajkę i otwiera odtwarzacz; offline pozwala tylko na pobrane. */
export function useStartStory() {
  const { play, story: current } = usePlayer();
  const { isDownloaded } = useDownloads();
  const network = useNetworkState();

  return (story: Story) => {
    const offline = network.isInternetReachable === false || network.isConnected === false;
    const playable = isBundled(story) || isDownloaded(story.id) || !offline;
    if (!playable) {
      Alert.alert(
        'Brak internetu',
        'Ta bajka nie jest pobrana na telefon. Połącz się z internetem albo wybierz bajkę z zakładki „Pobrane”.'
      );
      return;
    }
    if (current?.id !== story.id) play(story);
    router.push('/player');
  };
}

export function useIsOffline(): boolean {
  const network = useNetworkState();
  return network.isInternetReachable === false || network.isConnected === false;
}
