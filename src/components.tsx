import React, { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import { setSoundContext, useSound } from "./hooks";
import {
  isSoundEnabled,
  playSound,
  preloadSounds,
  registerSounds,
  setSoundEnabled,
  SoundName,
  subscribeSoundState,
  unlockAudioContext,
} from "./runtime";
import { SoundPack } from "./packs";
import { SoundOptions } from "./types";

/**
 * Props for the Sound component
 */
interface SoundProps {
  /**
   * The sound to play (will use local bundled sounds if available)
   */
  name: SoundName;

  /**
   * When to play the sound
   */
  trigger?: "mount" | "unmount" | "none";

  /**
   * Sound playback options
   */
  options?: SoundOptions;

  /**
   * Children components
   */
  children?: ReactNode;

  /**
   * Event handler for when the sound is loaded
   */
  onLoad?: () => void;

  /**
   * Event handler for when the sound is played
   */
  onPlay?: () => void;

  /**
   * Event handler for when the sound is stopped
   */
  onStop?: () => void;

  /**
   * Event handler for when the sound fails to play
   */
  onError?: (error: Error) => void;
}

/**
 * A component for playing a sound.
 * Will use locally downloaded sounds if available before falling back to CDN.
 */
export function Sound({
  name,
  trigger = "none",
  options,
  children,
  onLoad,
  onPlay,
  onStop,
  onError,
}: SoundProps): React.ReactElement {
  const { play, stop, isLoaded, isPlaying } = useSound(name, options);

  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  useEffect(() => {
    if (isPlaying && onPlay) {
      onPlay();
    }
  }, [isPlaying, onPlay]);

  useEffect(() => {
    if (trigger === "mount") {
      play(options).catch((error) => {
        if (onError) onError(error);
      });
    }

    return () => {
      if (trigger === "unmount") playSound(name, options);

      stop();
      if (onStop) onStop();
    };
  }, [trigger, name, play, stop, onStop, options, onError]);

  return <>{children}</>;
}

/**
 * Props for the SoundButton component
 */
interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The sound to play when clicked (will use local bundled sounds if available)
   */
  sound: SoundName;

  /**
   * Sound playback options
   */
  soundOptions?: SoundOptions;

  /**
   * Children components
   */
  children?: ReactNode;

  /**
   * Event handler for when the sound fails to play
   */
  onSoundError?: (error: Error) => void;
}

/**
 * A button that plays a sound when clicked.
 * Will use locally downloaded sounds if available before falling back to CDN.
 */
export function SoundButton({
  sound,
  soundOptions,
  children,
  onClick,
  onSoundError,
  ...props
}: SoundButtonProps): React.ReactElement {
  const { play } = useSound(sound, soundOptions);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    play().catch((error) => {
      if (onSoundError) onSoundError(error);
    });

    if (onClick) onClick(e);
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

/**
 * Sound context for managing sound state
 */
interface SoundContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const SoundContext = createContext<SoundContextType | null>(null);

// Register the context with hooks
setSoundContext(SoundContext);

/**
 * Props for the SoundProvider component
 */
interface SoundProviderProps {
  /**
   * Sounds to preload (will use local bundled sounds if available)
   */
  preload?: SoundName[];

  /**
   * Sound packs to register (see `registerSounds`). They are registered before any
   * child renders, so children can use pack sound names right away.
   */
  packs?: SoundPack[];

  /**
   * Initial sound enabled state (uses localStorage if not provided)
   */
  initialEnabled?: boolean;

  /**
   * How often to clean up unused sounds (in ms), set to 0 to disable
   */
  cleanupInterval?: number;

  /**
   * Children components
   */
  children: ReactNode;
}

/**
 * A provider that manages sound state and preloads sounds.
 * Will use locally downloaded sounds if available before falling back to CDN.
 */
export function SoundProvider({ preload = [], packs, initialEnabled, children }: SoundProviderProps): React.ReactElement {
  // Register during render (not in an effect): child effects run before parent effects,
  // so children calling useSound with pack names need the packs to exist already.
  // registerSounds is idempotent, so repeated renders are cheap and safe.
  packs?.forEach((pack) => registerSounds(pack));

  // Initialize sound enabled state from props or runtime
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (initialEnabled !== undefined) return initialEnabled;
    return isSoundEnabled();
  });

  // Update global state when React state changes
  const setEnabled = useCallback((newEnabled: boolean) => {
    setSoundEnabled(newEnabled);
  }, []);

  // Sync with global state changes from outside React
  useEffect(() => {
    return subscribeSoundState((newEnabled) => {
      setEnabledState(newEnabled);
    });
  }, []);

  // Ensure audio context is unlocked when component mounts
  useEffect(() => {
    unlockAudioContext();
  }, []);

  // Preload sounds when the component mounts
  useEffect(() => {
    if (preload.length > 0) {
      // Start preloading immediately but don't block rendering
      const preloadPromise = preloadSounds(preload);

      // Log any preloading errors but don't break the app
      preloadPromise.catch((error) => {
        console.error("Error preloading sounds:", error);
      });
    }
  }, [preload]);

  return <SoundContext.Provider value={{ enabled, setEnabled }}>{children}</SoundContext.Provider>;
}
