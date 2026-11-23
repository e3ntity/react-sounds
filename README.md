# react-sounds 🔊

<p align="center">
  <a href="https://www.npmjs.com/package/react-sounds"><img src="https://img.shields.io/npm/v/react-sounds.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-sounds"><img src="https://img.shields.io/npm/dm/react-sounds.svg" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/react-sounds"><img src="https://img.shields.io/bundlephobia/minzip/react-sounds" alt="bundle size" /></a>
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<p align="center">
  <b>Hundreds of ready-to-play sound effects for your React applications</b><br/>
  Add delight to your UI with just a few lines of code
</p>

<p align="center">
  <a href="https://www.reactsounds.com" target="_blank">Demo</a> •
  <a href="https://www.reactsounds.com/docs" target="_blank">Documentation</a> •
  <a href="https://www.reactsounds.com/sounds" target="_blank">Sound Explorer</a> •
  <a href="https://openfoley.com" target="_blank">More Sounds</a>
</p>

## ✨ Why react-sounds?

- 🪶 **Lightweight**: Only loads JS wrappers, audio files stay on CDN until needed
- 🏗️ **Lazy Loading**: Sounds are fetched only when they're used
- 📦 **Offline Support**: Download sounds for self-hosting with the included CLI
- 🎯 **Simple API**: Intuitive hooks and components
- 🔊 **Extensive Library**: Hundreds of categorized sounds (UI, notification, game)

## How does react-sounds compare?

| | react-sounds | use-sound | howler.js |
|---|---|---|---|
| Built-in sounds | 72+ | None | None |
| React hooks & components | Yes | Hooks | None |
| Bundle size (gzipped) | ~5 KB + howler, sounds load from a CDN when used | ~1 KB + howler (loaded lazily) | ~10 KB |
| TypeScript | Built-in | Built-in | @types |
| Last release | Nov 2026 | Feb 2025 | Sep 2023 |

> **react-sounds** wraps howler.js and adds a curated sound library, React components, and zero-config CDN delivery. [use-sound](https://github.com/joshwcomeau/use-sound) and [howler.js](https://howlerjs.com) are great standalone options if you bring your own audio files.

Coming from use-sound? See [use-sound vs react-sounds](https://www.reactsounds.com/guides/use-sound-vs-react-sounds) for a detailed comparison and how to switch.

## 🚀 Quick Start

```bash
npm install react-sounds howler
# or
yarn add react-sounds howler
```

```tsx
import { useSound } from 'react-sounds';

function Button() {
  const { play } = useSound('ui/button_soft');
  
  return (
    <button onClick={() => play()}>
      Click Me
    </button>
  );
}
```

### Your own sounds and sound packs

Any MP3 URL works (cross-origin files need CORS headers):

```tsx
const { play } = useSound('https://cdn.example.com/sounds/whoosh.mp3');
```

Or add a **sound pack**, a `manifest.json` listing MP3 files by name. The CLI writes the manifest and TypeScript types into your app:

```bash
npx react-sounds-cli add https://openfoley.com/c/ui-sounds   # add --download to copy the files into public/
```

```tsx
import uiSounds from './sounds/ui-sounds.json';

<SoundProvider packs={[uiSounds]}>...</SoundProvider>   // or registerSounds(uiSounds)

const { play } = useSound('ui-sounds/bright-success-chime');   // typed and autocompleted
```

Turn a folder of your own MP3s into a pack with `npx react-sounds-cli pack ./my-sounds`.

## 🧰 API at a Glance

| | What it does |
|---|---|
| `useSound(name, options)` | Returns `play`, `stop`, `pause`, `resume`, `isPlaying` and `isLoaded` for a sound |
| `useSoundOnChange(name, value)` | Plays a sound whenever `value` changes |
| `useSoundEnabled()` | App-wide mute toggle, remembered in `localStorage` |
| `<Sound name="..." trigger="mount" />` | Plays a sound when it mounts or unmounts, without a hook |
| `<SoundButton sound="...">` | A button that plays a sound on click |
| `<SoundProvider preload={[...]} packs={[...]}>` | Preloads sounds and registers sound packs |
| `registerSounds(pack)`, `preloadSounds(names)` | The same outside of React |

Every option is in the [documentation](https://www.reactsounds.com/docs).

## 🎨 More Sounds

Need a sound that isn't built in? [openfoley](https://openfoley.com) is an open library of CC0 sound effects and sound packs that work with react-sounds out of the box. You can also generate new sounds there with AI.

## 📚 Documentation

For complete documentation including advanced usage, visit [reactsounds.com/docs](https://www.reactsounds.com/docs)

Guides:
- [How to play sounds in React](https://www.reactsounds.com/guides/play-sound-in-react): the Audio element, the Web Audio API and libraries compared
- [Using Howler.js in React](https://www.reactsounds.com/guides/howler-react): a small hook that loads once and cleans up after itself
- [use-sound vs react-sounds](https://www.reactsounds.com/guides/use-sound-vs-react-sounds): when to pick which, and how to switch

## 🎮 Live Demo

Try the interactive demo at [reactsounds.com](https://www.reactsounds.com)

## 🔍 Explore All Sounds

Browse and play all available sounds at [reactsounds.com/sounds](https://www.reactsounds.com/sounds)

## 💻 Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Sounds play through the Web Audio API, with an HTML5 Audio fallback from howler.js.

## 📄 License

MIT © Lukas Schneider
