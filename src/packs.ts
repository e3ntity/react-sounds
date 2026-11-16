import manifest from "./manifest.json";

/**
 * Names of sounds from registered sound packs.
 *
 * This interface is empty by default. `react-sounds-cli add` generates a declaration file that
 * augments it, which gives pack sound names autocompletion and type checking:
 *
 * ```ts
 * declare module "react-sounds" {
 *   interface CustomSoundNames {
 *     "my-ui-pack/save": true;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomSoundNames {}

/**
 * A single sound in a sound pack manifest
 */
export interface SoundPackSound {
  /** Path of the MP3 file, relative to the pack's baseUrl (or an absolute URL) */
  src: string;
  /** Duration in seconds */
  duration?: number;
  /** SPDX license identifier, e.g. "CC0-1.0" */
  license?: string;
  /** Page where the sound was published */
  source?: string;
}

/**
 * A sound pack manifest. Sounds are addressed as `"<pack name>/<sound key>"`.
 */
export interface SoundPack {
  $schema?: string;
  /** Pack name, used as the prefix of every sound name. Must not contain "/". */
  name: string;
  version?: string;
  /** Base URL the `src` paths are resolved against. Defaults to `/sounds/<name>`. */
  baseUrl?: string;
  /** Where the manifest was downloaded from (written by the CLI) */
  source?: string;
  sounds: Record<string, SoundPackSound>;
}

export interface RegisterSoundsOptions {
  /** Overrides the pack's baseUrl, e.g. when self-hosting the pack's files */
  baseUrl?: string;
}

const PACK_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

/** Resolved URLs of all registered pack sounds, keyed by full sound name */
const packSoundUrls: Record<string, string> = {};

export function isPackSoundName(name: unknown): boolean {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(packSoundUrls, name);
}

export function getPackSoundUrl(name: string): string | undefined {
  return isPackSoundName(name) ? packSoundUrls[name] : undefined;
}

export function joinUrl(baseUrl: string, src: string): string {
  // Absolute URLs, protocol-relative URLs and root paths are used as-is
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("/")) return src;
  return `${baseUrl.replace(/\/+$/, "")}/${src.replace(/^\.\//, "")}`;
}

/**
 * Adds a pack's sounds to the registry.
 * Returns the names whose URL changed (new or updated), so caches can be invalidated.
 * @internal
 */
export function addPack(pack: SoundPack, options: RegisterSoundsOptions = {}): string[] {
  if (!pack || typeof pack !== "object" || typeof pack.sounds !== "object" || pack.sounds === null) {
    throw new TypeError("registerSounds: expected a sound pack manifest with a `sounds` object");
  }
  if (typeof pack.name !== "string" || !PACK_NAME.test(pack.name)) {
    throw new TypeError(
      `registerSounds: invalid pack name "${pack.name}" (use letters, numbers, ".", "_" and "-", no "/")`
    );
  }

  const baseUrl = options.baseUrl ?? pack.baseUrl ?? `/sounds/${pack.name}`;
  const changed: string[] = [];

  for (const [key, sound] of Object.entries(pack.sounds)) {
    const name = `${pack.name}/${key}`;

    if (name in manifest.sounds) {
      console.warn(`react-sounds: pack sound "${name}" conflicts with a built-in sound and was ignored`);
      continue;
    }
    if (!sound || typeof sound.src !== "string" || !sound.src) {
      console.warn(`react-sounds: pack sound "${name}" has no src and was ignored`);
      continue;
    }

    const url = joinUrl(baseUrl, sound.src);
    if (packSoundUrls[name] !== url) {
      packSoundUrls[name] = url;
      changed.push(name);
    }
  }

  return changed;
}

/** @internal */
export function __resetPacksForTesting(): void {
  for (const key of Object.keys(packSoundUrls)) delete packSoundUrls[key];
}
