import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('howler', async () => {
  const { createMockHowl } = await import('./mocks');
  return {
    Howl: vi.fn().mockImplementation(() => createMockHowl()),
    Howler: { ctx: { state: 'running' }, noAudio: false },
  };
});

import {
  setCDNUrl,
  getCDNUrl,
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundState,
  fetchSoundBlob,
  playSound,
  checkAudioPermission,
  cleanupUnusedSound,
  __resetForTesting,
} from '../../src/runtime';
import { Howler } from 'howler';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  __resetForTesting();
});

describe('setCDNUrl / getCDNUrl', () => {
  it('sets and retrieves a custom CDN URL', () => {
    setCDNUrl('https://my-cdn.example.com');
    expect(getCDNUrl()).toBe('https://my-cdn.example.com');
  });
});

describe('isSoundEnabled / setSoundEnabled', () => {
  it('defaults to enabled', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('can be toggled off and on', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('persists state to localStorage', () => {
    setSoundEnabled(false);
    expect(localStorage.getItem('react-sounds-enabled')).toBe('false');
    setSoundEnabled(true);
    expect(localStorage.getItem('react-sounds-enabled')).toBe('true');
  });
});

describe('subscribeSoundState', () => {
  it('notifies subscribers when state changes', () => {
    const callback = vi.fn();
    subscribeSoundState(callback);
    setSoundEnabled(false);
    expect(callback).toHaveBeenCalledWith(false);
  });

  it('unsubscribe stops notifications', () => {
    const callback = vi.fn();
    const unsub = subscribeSoundState(callback);
    unsub();
    setSoundEnabled(false);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('fetchSoundBlob', () => {
  it('falls back to CDN when local HEAD fails', async () => {
    const blob = new Blob(['audio'], { type: 'audio/mp3' });
    const mockFetch = vi.fn()
      // First call: local HEAD - fail
      .mockRejectedValueOnce(new Error('network'))
      // Second call: CDN fetch - succeed
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(blob) });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchSoundBlob('ui/toggle_on');
    expect(result).toBe(blob);
    // CDN URL should contain the manifest src path
    expect(mockFetch.mock.calls[1][0]).toContain('ui/toggle_on');
  });

  it('throws for unknown custom sound when fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));
    await expect(fetchSoundBlob('my-custom-sound-xyz')).rejects.toThrow(
      'Failed to load custom sound "my-custom-sound-xyz"'
    );
  });
});

describe('playSound', () => {
  it('does nothing when sounds are disabled', async () => {
    setSoundEnabled(false);
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    await playSound('ui/toggle_on');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('cleanupUnusedSound', () => {
  it('is a no-op when there is no cached entry', () => {
    // Should not throw
    cleanupUnusedSound('nonexistent');
  });
});

describe('checkAudioPermission', () => {
  it('returns "granted" when ctx.state is running', async () => {
    (Howler as any).ctx = { state: 'running' };
    (Howler as any).noAudio = false;
    expect(await checkAudioPermission()).toBe('granted');
  });

  it('returns "prompt" when ctx.state is suspended', async () => {
    (Howler as any).ctx = { state: 'suspended' };
    (Howler as any).noAudio = false;
    expect(await checkAudioPermission()).toBe('prompt');
  });

  it('returns "unavailable" when noAudio is true', async () => {
    (Howler as any).noAudio = true;
    expect(await checkAudioPermission()).toBe('unavailable');
  });
});
