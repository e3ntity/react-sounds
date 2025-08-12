
/**
 * Categories of sounds available in the library
 */
export type SoundCategory = 'ambient' | 'arcade' | 'game' | 'misc' | 'notification' | 'system' | 'ui';

/**
 * AmbientSoundName sound names
 */
export type AmbientSoundName = 'campfire' | 'heartbeat' | 'rain' | 'water_stream' | 'wind';

/**
 * ArcadeSoundName sound names
 */
export type ArcadeSoundName = 'coin' | 'coin_bling' | 'jump' | 'level_down' | 'level_up' | 'power_down' | 'power_up' | 'upgrade';

/**
 * GameSoundName sound names
 */
export type GameSoundName = 'coin' | 'hit' | 'miss' | 'portal_closing' | 'portal_opening' | 'void';

/**
 * MiscSoundName sound names
 */
export type MiscSoundName = 'silence';

/**
 * NotificationSoundName sound names
 */
export type NotificationSoundName = 'completed' | 'error' | 'info' | 'message' | 'notification' | 'popup' | 'reminder' | 'success' | 'warning';

/**
 * SystemSoundName sound names
 */
export type SystemSoundName = 'boot_down' | 'boot_up' | 'device_connect' | 'device_disconnect' | 'lock' | 'screenshot' | 'trash';

/**
 * UiSoundName sound names
 */
export type UiSoundName = 'blocked' | 'button_hard' | 'button_hard_double' | 'button_medium' | 'button_soft' | 'button_soft_double' | 'button_squishy' | 'buzz' | 'buzz_deep' | 'buzz_long' | 'copy' | 'input_blur' | 'input_focus' | 'item_deselect' | 'item_select' | 'keystroke_hard' | 'keystroke_medium' | 'keystroke_soft' | 'panel_collapse' | 'panel_expand' | 'pop_close' | 'pop_open' | 'popup_close' | 'popup_open' | 'radio_select' | 'send' | 'submit' | 'success_bling' | 'success_blip' | 'success_chime' | 'tab_close' | 'tab_open' | 'toggle_off' | 'toggle_on' | 'window_close' | 'window_open';

/**
 * All available sound names
 */
export type LibrarySoundName =
  | `ambient/${AmbientSoundName}`
  | `arcade/${ArcadeSoundName}`
  | `game/${GameSoundName}`
  | `misc/${MiscSoundName}`
  | `notification/${NotificationSoundName}`
  | `system/${SystemSoundName}`
  | `ui/${UiSoundName}`;

/**
 * Sound options for playback
 */
export interface SoundOptions {
  /**
   * Volume of the sound (0.0 to 1.0)
   */
  volume?: number;
  
  /**
   * Playback rate (1.0 is normal speed)
   */
  rate?: number;
  
  /**
   * Sound should loop
   */
  loop?: boolean;
}

/**
 * Return type for useSound hook
 */
export interface SoundHookReturn {
  /**
   * Play the sound with optional options
   */
  play: (options?: SoundOptions) => Promise<void>;
  
  /**
   * Stop the sound
   */
  stop: () => void;
  
  /**
   * Pause the sound
   */
  pause: () => void;
  
  /**
   * Resume the sound
   */
  resume: () => void;
  
  /**
   * Check if the sound is currently playing
   */
  isPlaying: boolean;
  
  /**
   * Check if the sound is loaded
   */
  isLoaded: boolean;

  /**
   * Get the current playback time in seconds
   */
  currentTime: () => number;

  /**
   * Get the total duration of the sound in seconds
   */
  duration: () => number;

  /**
   * Get the current playback rate
   */
  playbackRate: () => number;

  /**
   * Set playback rate
   */
  setPlaybackRate: (rate: number) => void;

  /**
   * Seek to a position or relative offset
   */
  seek: (position: number | ((current: number) => number)) => void;
}