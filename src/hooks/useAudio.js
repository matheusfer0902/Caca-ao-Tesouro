import { useCallback, useRef } from 'react';

const SOUNDS = {
  pirate_music: { src: '/assets/pirate_music.mp3', loop: true, volume: 0.3 },
  ship: { src: '/assets/ship.mp3', volume: 0.5 },
  chest: { src: '/assets/chest.mp3', volume: 0.5 },
  chest_error: { src: '/assets/chest_error.mp3', volume: 0.5 },
  restart: { src: '/assets/restart.mp3', volume: 0.5 },
  change_grid: { src: '/assets/change_grid.mp3', volume: 0.5 },
};

export function useAudio() {
  const cacheRef = useRef({});
  const musicStartedRef = useRef(false);

  const getAudio = useCallback((name) => {
    if (!cacheRef.current[name]) {
      const config = SOUNDS[name];
      const audio = new Audio(config.src);
      audio.volume = config.volume ?? 0.5;
      if (config.loop) audio.loop = true;
      cacheRef.current[name] = audio;
    }
    return cacheRef.current[name];
  }, []);

  const playSound = useCallback(
    (name) => {
      const audio = getAudio(name);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    },
    [getAudio]
  );

  const startMusic = useCallback(() => {
    if (musicStartedRef.current) return;
    musicStartedRef.current = true;
    getAudio('pirate_music').play().catch(() => {});
  }, [getAudio]);

  return { playSound, startMusic };
}
