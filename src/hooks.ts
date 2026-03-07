import { Howl } from "howler";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { checkAudioPermission, claimSound, freeSound, isSoundEnabled, preloadSounds, SoundName, unlockAudioContext } from "./runtime";
import { SoundHookReturn, SoundOptions } from "./types";

interface SoundContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// We'll get the actual context from components.tsx when using it
type SoundContextValue = React.Context<SoundContextType | null>;

// This will be set by SoundProvider from components.tsx
let SoundContext: SoundContextValue;

// Function to set the context from components.tsx
export function setSoundContext(context: SoundContextValue): void {
  SoundContext = context;
}

/**
 * Hook for using a sound in a React component.
 * Will use local bundled sounds if available before falling back to remote.
 */
export function useSound(soundName: SoundName, defaultOptions: SoundOptions = {}): SoundHookReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const activeSoundsRef = useRef<Array<{ id: number; loop: boolean; resolver?: () => void }>>([]);

  // Get sound enabled state from context if available, fall back to global state
  let enabled = isSoundEnabled();
  try {
    const soundContext = SoundContext ? useContext(SoundContext) : null;
    if (soundContext) enabled = soundContext.enabled;
  } catch (e) {}

  // Lazy loading approach - only load the sound when needed
  const ensureLoaded = useCallback(async (): Promise<Howl> => {
    if (soundRef.current) return soundRef.current;

    try {
      const howl = await claimSound(soundName);

      // Set up event listeners
      howl.on("end", (id) => {
        const soundIndex = activeSoundsRef.current.findIndex((sound) => sound.id === id);
        if (soundIndex >= 0) {
          const sound = activeSoundsRef.current[soundIndex];

          if (sound.resolver) sound.resolver(); // Resolve sound (eg. created in play())
          if (!sound.loop) activeSoundsRef.current.splice(soundIndex, 1);
        }

        // Only update isPlaying state if no active sounds remain
        if (activeSoundsRef.current.length === 0) {
          soundRef.current = freeSound(soundName);
          setIsPlaying(false);
        }
      });

      soundRef.current = howl;
      setIsLoaded(true);
      return howl;
    } catch (error) {
      console.error("Error loading sound:", error);
      throw error;
    }
  }, [soundName, setIsPlaying]);

  const play = useCallback(
    async (options: SoundOptions = defaultOptions) => {
      if (!enabled) return;

      try {
        // Ensure audio context is unlocked before playing
        await unlockAudioContext();

        // Ensure the sound is loaded
        const howl = await ensureLoaded();

        const loop = options.loop !== undefined ? options.loop : false;
        if (options.volume !== undefined) howl.volume(options.volume);
        if (options.rate !== undefined) howl.rate(options.rate);
        howl.loop(loop);

        const id = howl.play();
        setIsPlaying(true);

        if (loop) {
          // For looped sounds, we just track them but don't resolve
          activeSoundsRef.current.push({ id, loop });
          return;
        }

        // For non-looped sounds, return a promise that resolves when the sound ends
        return new Promise<void>((resolve) => {
          activeSoundsRef.current.push({ id, loop, resolver: () => resolve() });
        });
      } catch (error) {
        console.error("Error playing sound:", error);
        throw error;
      }
    },
    // isLoaded is a required dep for handling changed sound name
    [defaultOptions, enabled, ensureLoaded, isLoaded]
  );

  const stop = useCallback(() => {
    if (!soundRef.current) return;

    // Resolve any pending promises
    activeSoundsRef.current.forEach((sound) => {
      if (sound.resolver) sound.resolver();
    });

    soundRef.current.stop();
    soundRef.current = freeSound(soundName);
    activeSoundsRef.current = [];
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    if (!soundRef.current) return;

    soundRef.current.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (!soundRef.current || !enabled || activeSoundsRef.current.length === 0) return;

    // Try to unlock audio context before resuming
    unlockAudioContext().then(() => {
      activeSoundsRef.current.forEach(({ id }) => soundRef.current?.play(id));
      setIsPlaying(true);
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled && isPlaying) pause(); // Pause all sounds when disabled
  }, [enabled, isPlaying, pause]);

  // Cleanup on unmount
  useEffect(() => {
    preloadSounds([soundName]).then(() => setIsLoaded(true));

    return () => {
      setIsLoaded(false);
      setIsPlaying(false);

      activeSoundsRef.current.forEach((sound) => {
        if (sound.resolver) sound.resolver(); // Resolve any pending promises
      });
      activeSoundsRef.current = [];

      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current = freeSound(soundName);
      }
    };
  }, [soundName]);

  const checkPermission = useCallback(() => checkAudioPermission(), []);

  return { play, stop, pause, resume, isPlaying, isLoaded, checkPermission };
}

interface UseSoundOnChangeOptions extends SoundOptions {
  initial?: boolean;
}

/**
 * Hook for playing a sound when a value changes
 */
export function useSoundOnChange<T>(soundName: SoundName, value: T, options?: UseSoundOnChangeOptions): void {
  const { play } = useSound(soundName);
  const initialRef = useRef(true);

  useEffect(() => {
    const skipThisInitialRun = initialRef.current && options?.initial === false;
    initialRef.current = false;
    if (skipThisInitialRun) return;

    play(options).catch((err) => console.error("Failed to play sound:", err));
  }, [value]);
}

/**
 * Hook for accessing and controlling the sound enabled state
 */
export function useSoundEnabled(): [boolean, (enabled: boolean) => void] {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSoundEnabled must be used within a SoundProvider");

  return [context.enabled, context.setEnabled];
}
