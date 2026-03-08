# Changelog

All notable changes to this project will be documented in this file.

## [1.0.30] - 2026-03-08

### Added
- ESLint configuration with TypeScript support
- Expanded npm keywords for better discoverability
- Comparison table, additional badges in README
- `CHANGELOG.md` and `CONTRIBUTING.md`

## [1.0.29] - 2026-03-08

### Fixed
- Fixed SoundProvider context not propagating sound state correctly (#8)
- Fixed compatibility issues with Next.js

### Added
- Unit test suite and integration test scaffold

### Changed
- Fixed lint errors (empty blocks/functions) in hooks and runtime

## [1.0.28] - 2026-03-07

### Added
- `checkAudioPermission` utility to `useSound` hook and runtime exports (#7)

### Fixed
- Fixed AudioContext resource leak in `checkAudioPermission`

## [1.0.27] - 2026-03-07

### Changed
- Updated repository URLs and ownership

## [1.0.26] - 2025-08-13

### Fixed
- Fixed deriving playback metrics from Howl without causing excessive re-renders

### Changed
- Refactored playback state to derive metrics directly from Howl instance (#4)

## [1.0.25] - 2025-05-05

### Added
- Exported `fetchSoundBlob` function for fetching sounds as blobs

## [1.0.24] - 2025-04-30

### Added
- Custom sound playback support

### Fixed
- Fixed `react-sounds-cli`

## [1.0.22] - 2025-04-30

### Fixed
- Fixed `useSoundOnChange` hook to only run when value changes

## [1.0.20] - 2025-04-30

### Fixed
- Fixed `useSound` hook not updating play callback when sound name changes

## [1.0.19] - 2025-04-30

### Fixed
- Fixed `useSound` hook not updating play callback when sound name changes
- Improved handling of limited sound resources by cleaning and locking sound resources

## [1.0.18] - 2025-04-29

### Fixed
- Fixed freezing JavaScript thread when testing if local file exists
- Added short timeout when testing for local sound files
- Improved sound loading reliability

## [1.0.0] - 2025-04-29

### Added
- `useSound` hook for playing sound effects with full playback control
- `useSoundOnChange` hook for triggering sounds on value changes
- `useSoundEnabled` hook for global sound toggle
- `Sound`, `SoundButton`, and `SoundProvider` React components
- 72+ categorized sound effects (ambient, arcade, game, notification, system, UI)
- CDN-based lazy loading with local file fallback
- CLI tool (`react-sounds-cli`) for downloading sounds for self-hosting
- TypeScript support with full type definitions
- Next.js compatibility with "use client" directive
- Global sound state management with localStorage persistence
