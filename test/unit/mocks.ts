import { vi } from 'vitest';

export function createMockHowl() {
  return {
    play: vi.fn().mockReturnValue(1),
    stop: vi.fn(),
    pause: vi.fn(),
    volume: vi.fn(),
    rate: vi.fn(),
    loop: vi.fn(),
    on: vi.fn(),
    playing: vi.fn().mockReturnValue(false),
    unload: vi.fn(),
  };
}

export function createRuntimeMock(overrides?: Record<string, unknown>) {
  return {
    claimSound: vi.fn().mockResolvedValue(createMockHowl()),
    freeSound: vi.fn().mockReturnValue(null),
    isSoundEnabled: vi.fn().mockReturnValue(true),
    preloadSounds: vi.fn().mockResolvedValue([]),
    unlockAudioContext: vi.fn().mockResolvedValue(undefined),
    checkAudioPermission: vi.fn().mockResolvedValue('granted'),
    subscribeSoundState: vi.fn().mockReturnValue(() => {}),
    setSoundEnabled: vi.fn(),
    initSoundEnabledState: vi.fn(),
    playSound: vi.fn(),
    initAudioContextUnlock: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}
