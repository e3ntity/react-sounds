# react-sounds 🔊

<p align="center">
  <img src="https://img.shields.io/npm/v/react-sounds.svg" alt="npm version" />
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
  <a href="https://www.reactsounds.com/sounds" target="_blank">Sound Explorer</a>
</p>

## ✨ Why react-sounds?

- 🪶 **Lightweight**: Only loads JS wrappers, audio files stay on CDN until needed
- 🏗️ **Lazy Loading**: Sounds are fetched only when they're used
- 📦 **Offline Support**: Download sounds for self-hosting with the included CLI
- 🎯 **Simple API**: Intuitive hooks and components
- 🔊 **Extensive Library**: Hundreds of categorized sounds (UI, notification, game)

## 🚀 Quick Start

```bash
npm install react-sounds howler
# or
yarn add react-sounds howler
```

```tsx
import { useSound } from 'react-sounds';

function Button() {
  const { play } = useSound('ui/button_1');
  
  return (
    <button onClick={() => play()}>
      Click Me
    </button>
  );
}
```

## 📚 Documentation

For complete documentation including advanced usage, visit [reactsounds.com/docs](https://www.reactsounds.com/docs)

## 🎮 Live Demo

Try the interactive demo at [reactsounds.com](https://www.reactsounds.com)

## 🔍 Explore All Sounds

Browse and play all available sounds at [reactsounds.com/sounds](https://www.reactsounds.com/sounds)

## 💻 Browser Support

Works in all modern browsers that support the Web Audio API (Chrome, Firefox, Safari, Edge)

## 📄 License

MIT © Lukas Schneider
