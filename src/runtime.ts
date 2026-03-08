import { Howl, Howler } from "howler";
import manifest from "./manifest.json";
import { AudioPermissionStatus, LibrarySoundName, SoundOptions } from "./types";

export type SoundName = LibrarySoundName | string;

export function isLibrarySoundName(name: any): name is LibrarySoundName {
  return name in manifest.sounds;
}

// Default CDN base URL
let cdnBaseUrl = "https://reactsounds.sfo3.cdn.digitaloceanspaces.com/v1";

// Global sound enabled state
let soundEnabledGlobal = true;

// Global event listeners for sound state changes
const soundStateListeners: Array<(enabled: boolean) => void> = [];

// Track if we've already set up audio context unlocking
let audioUnlockInitialized = false;

/**
 * Set a custom CDN base URL
 */
export function setCDNUrl(url: string): void {
  cdnBaseUrl = url;
}

/**
 * Get the CDN base URL
 */
export function getCDNUrl(): string {
  return cdnBaseUrl;
}

/**
 * Cache of preloaded sound blobs to avoid HTML5 audio pool exhaustion
 */
const soundBlobCache: Record<string, Promise<Blob>> = {};

// TODO: turn "subscriptions" into a list of ids for better lock tracking
export type HowlEntry = { instance: Howl; subscriptions: number };

/**
 * Cache of created Howl instances (only created when actually played)
 */
const howlInstanceCache: Record<string, HowlEntry> = {};

/**
 * Make a sound loader function that first tries local files then falls back to CDN
 */
export function makeRemoteSound(name: SoundName): () => Promise<HowlEntry> {
  return async () => {
    // First fetch the blob data if not already in cache
    if (!soundBlobCache[name]) {
      soundBlobCache[name] = fetchSoundBlob(name);
    }

    // Create or return the Howl instance
    return createOrGetHowlInstance(name);
  };
}

export async function claimSound(name: SoundName): Promise<Howl> {
  const entry = await makeRemoteSound(name)();
  entry.subscriptions += 1;

  return entry.instance;
}

export function freeSound(name: SoundName) {
  const entry = howlInstanceCache[name];
  if (entry && entry.subscriptions > 0) entry.subscriptions -= 1;

  cleanupUnusedSound(name);

  return null;
}

/**
 * Fetches sound data as a blob, from local filesystem or CDN
 */
export async function fetchSoundBlob(name: SoundName): Promise<Blob> {
  try {
    // Try to fetch from local first
    const localPath = await getLocalSoundPath(name);
    if (localPath) {
      const response = await fetch(localPath);
      if (response.ok) return await response.blob();
    }
  } catch (error) {
    console.warn(`Error loading local sound "${name}", falling back to CDN:`, error);
  }

  if (!isLibrarySoundName(name)) throw new Error(`Failed to load custom sound "${name}"`);

  // Fall back to CDN
  const soundInfo = manifest.sounds[name];
  const soundUrl = `${cdnBaseUrl}/${soundInfo.src}`;

  const response = await fetch(soundUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sound "${name}" from CDN`);
  }

  return await response.blob();
}

/**
 * Creates a Howl instance from a cached blob or fetches it if needed
 */
async function createOrGetHowlInstance(name: SoundName): Promise<HowlEntry> {
  // Return existing instance if available
  if (howlInstanceCache[name]) {
    return howlInstanceCache[name];
  }

  // Fetch the blob if not already in progress
  if (!soundBlobCache[name]) {
    soundBlobCache[name] = fetchSoundBlob(name);
  }

  // Wait for the blob to be fetched
  const blob = await soundBlobCache[name];

  // Create object URL from blob
  const objectUrl = URL.createObjectURL(blob);

  // Create new Howl instance
  const howl = new Howl({
    src: [objectUrl],
    format: ["mp3"],
    html5: true, // Enable streaming to reduce memory usage
    onload: () => {
      // Store object URL reference to revoke later
      (howl as any)._objectUrl = objectUrl;
    },
  });

  // Store in cache
  howlInstanceCache[name] = { instance: howl, subscriptions: 0 };

  return howlInstanceCache[name];
}

/**
 * Preload multiple sounds by fetching their data without creating Howl instances
 */
export function preloadSounds(names: SoundName[]): Promise<void[]> {
  return Promise.all(
    names.map(async (name) => {
      if (!soundBlobCache[name]) {
        soundBlobCache[name] = fetchSoundBlob(name);
      }
      // Just ensure the blob is fetched but don't create Howl instance yet
      await soundBlobCache[name];
    })
  );
}

/**
 * Play a sound by name
 */
export async function playSound(name: SoundName, options?: SoundOptions): Promise<void> {
  if (!isSoundEnabled()) return;

  const sound = await claimSound(name);
  let freed = false;

  if (options) {
    if (options.volume !== undefined) sound.volume(options.volume);
    if (options.rate !== undefined) sound.rate(options.rate);
    if (options.loop !== undefined) sound.loop(options.loop);
  }

  sound.on("end", () => {
    if (freed || options?.loop) return;
    freeSound(name);
    freed = true;
  });

  sound.play();
}

/**
 * Check if sounds are enabled
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false; // Server environment not supported
  return soundEnabledGlobal;
}

/**
 * Enable or disable all sounds
 * This is used internally by the SoundProvider
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabledGlobal = enabled;

  // Store in localStorage for persistence
  if (typeof localStorage !== "undefined") localStorage.setItem("react-sounds-enabled", enabled ? "true" : "false");

  soundStateListeners.forEach((listener) => listener(enabled));
}

/**
 * Initialize the sound enabled state
 * Called at startup to load saved preference
 */
export function initSoundEnabledState(): void {
  if (typeof localStorage === "undefined") return;

  const savedPreference = localStorage.getItem("react-sounds-enabled");
  if (savedPreference !== null) {
    soundEnabledGlobal = savedPreference !== "false";
  }
}

/**
 * Subscribe to sound enabled state changes
 */
export function subscribeSoundState(callback: (enabled: boolean) => void): () => void {
  soundStateListeners.push(callback);

  // Return unsubscribe function
  return () => {
    const index = soundStateListeners.indexOf(callback);
    if (index !== -1) soundStateListeners.splice(index, 1);
  };
}

/**
 * Get the local path for a sound when using the offline mode
 */
export async function getLocalSoundPath(name: SoundName): Promise<string | null> {
  if (!isLibrarySoundName(name)) return name;

  const publicPath = `/sounds/${name}.mp3`;
  try {
    // Add a timeout of 300ms to quickly fall back to CDN if file isn't available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);

    const response = await fetch(publicPath, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    if (!response.headers.get("content-type")?.toLowerCase().startsWith("audio")) return null;

    return publicPath;
  } catch (e) {}

  return null;
}

/**
 * Clean up unused Howl instances and blob cache entries
 * Call this when running into memory constraints
 */
export function cleanupUnusedSound(name: string): void {
  const entry = howlInstanceCache[name];
  if (!entry || entry.instance.playing() || entry.subscriptions > 0) return;

  const { instance } = entry;
  if ((instance as any)._objectUrl) URL.revokeObjectURL((instance as any)._objectUrl);
  instance.unload();
  delete howlInstanceCache[name];
}

/**
 * Unlock the audio context globally to allow playback without direct user interaction
 */
export async function unlockAudioContext(): Promise<void> {
  if (typeof window === "undefined" || !Howler.ctx) return;
  if (Howler.ctx.state !== "suspended") return;

  try {
    await Howler.ctx.resume();
  } catch (error) {
    console.warn("Failed to unlock audio context:", error);
  }
}

/**
 * Setup global event listeners to unlock audio context on user interaction
 * Can be called multiple times safely (will only set up listeners once)
 */
export function initAudioContextUnlock(): () => void {
  if (typeof window === "undefined" || audioUnlockInitialized) return () => {};

  audioUnlockInitialized = true;

  const events = ["click", "touchstart", "keydown"];

  const handleInteraction = () => {
    unlockAudioContext();
    events.forEach((event) => document.removeEventListener(event, handleInteraction));
  };

  events.forEach((event) => document.addEventListener(event, handleInteraction));

  // Return cleanup function
  return () => {
    events.forEach((event) => document.removeEventListener(event, handleInteraction));
  };
}

/**
 * Check the browser's audio permission status.
 * Uses AudioContext.state to determine if audio playback is allowed.
 */
export async function checkAudioPermission(): Promise<AudioPermissionStatus> {
  if (typeof window === "undefined") return "unavailable";
  if (Howler.noAudio) return "unavailable";

  let state: string;

  if (Howler.ctx) {
    state = Howler.ctx.state;
  } else {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return "unavailable";
      const tempCtx = new AudioCtx();
      state = tempCtx.state;
      await tempCtx.close().catch(() => {});
    } catch {
      return "unavailable";
    }
  }

  switch (state) {
    case "running":
      return "granted";
    case "suspended":
      return "prompt";
    default:
      return "unavailable";
  }
}

/**
 * Reset all module-level state for testing purposes.
 * @internal
 */
export function __resetForTesting(): void {
  cdnBaseUrl = "https://reactsounds.sfo3.cdn.digitaloceanspaces.com/v1";
  soundEnabledGlobal = true;
  soundStateListeners.length = 0;
  audioUnlockInitialized = false;
  for (const key of Object.keys(soundBlobCache)) delete soundBlobCache[key];
  for (const key of Object.keys(howlInstanceCache)) delete howlInstanceCache[key];
}

// Initialize sound state
initSoundEnabledState();

// Initialize audio context unlocking if we're in a browser environment
if (typeof window !== "undefined") {
  initAudioContextUnlock();
}
