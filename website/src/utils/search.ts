import Fuse from "fuse.js";
import keywords from "../keywords.json";
import manifest from "../manifest.json";

type SoundMetadata = (typeof manifest.sounds)[keyof typeof manifest.sounds];
export type SoundEntry = [string, SoundMetadata];

const soundEntries = Object.entries(manifest.sounds) as SoundEntry[];

const fuse = new Fuse(
  soundEntries.map(([key]) => {
    const [category, name] = key.split("/");
    return {
      key,
      category,
      name: name.replace(/_/g, " "),
      keywords: (keywords as Record<string, string[]>)[key] ?? [],
    };
  }),
  {
    keys: [
      { name: "name", weight: 3 },
      { name: "keywords", weight: 2 },
      { name: "category", weight: 1 },
    ],
    threshold: 0.25,
    ignoreLocation: true,
    useExtendedSearch: true,
  }
);

// Returns matching sounds ranked by relevance, or all sounds for an empty search.
// Fuzzy matching only kicks in when no sound contains every search word exactly.
export const searchSounds = (searchTerm: string): SoundEntry[] => {
  const words = searchTerm
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return soundEntries;

  const exactResults = fuse.search(words.map((word) => `'${word}`).join(" "));
  const results = exactResults.length > 0 ? exactResults : fuse.search(words.join(" "));

  return results.map(({ item }) => [item.key, manifest.sounds[item.key as keyof typeof manifest.sounds]]);
};
