import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMockHowl } from './mocks';

vi.mock('../../src/runtime', async () => {
  const { createRuntimeMock } = await import('./mocks');
  return createRuntimeMock();
});

import { useSound, useSoundEnabled, useSoundOnChange } from '../../src/hooks';
import { claimSound, freeSound, isSoundEnabled } from '../../src/runtime';

let mockHowl: ReturnType<typeof createMockHowl>;

beforeEach(() => {
  vi.clearAllMocks();
  mockHowl = createMockHowl();
  vi.mocked(isSoundEnabled).mockReturnValue(true);
  vi.mocked(claimSound).mockResolvedValue(mockHowl);
});

/** Helper: render useSound and flush the preloadSounds effect */
async function renderUseSound(soundName = 'ui/toggle_on') {
  const hook = renderHook(() => useSound(soundName));
  await act(async () => {});
  return hook;
}

/** Helper: trigger play and flush its async state updates */
async function triggerPlay(result: { current: ReturnType<typeof useSound> }) {
  act(() => {
    void result.current.play();
  });
  // Flush the async chain (unlockAudioContext → claimSound → setIsPlaying)
  await act(async () => {});
}

describe('useSound', () => {
  it('returns the correct shape', async () => {
    const { result } = await renderUseSound();
    expect(result.current).toHaveProperty('play');
    expect(result.current).toHaveProperty('stop');
    expect(result.current).toHaveProperty('pause');
    expect(result.current).toHaveProperty('resume');
    expect(result.current).toHaveProperty('isPlaying');
    expect(result.current).toHaveProperty('isLoaded');
    expect(result.current).toHaveProperty('checkPermission');
    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.isPlaying).toBe('boolean');
  });

  it('play() calls claimSound then plays', async () => {
    const { result } = await renderUseSound();
    await triggerPlay(result);

    expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    expect(mockHowl.play).toHaveBeenCalled();
  });

  it('play() does nothing when sounds are disabled', async () => {
    vi.mocked(isSoundEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useSound('ui/toggle_on'));
    await act(async () => {});

    await act(async () => {
      await result.current.play();
    });

    expect(claimSound).not.toHaveBeenCalled();
  });

  it('stop() calls howl.stop() and frees sound', async () => {
    const { result } = await renderUseSound();
    await triggerPlay(result);

    act(() => {
      result.current.stop();
    });

    expect(mockHowl.stop).toHaveBeenCalled();
    expect(freeSound).toHaveBeenCalled();
  });

  it('pause() calls howl.pause()', async () => {
    const { result } = await renderUseSound();
    await triggerPlay(result);

    act(() => {
      result.current.pause();
    });

    expect(mockHowl.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('resume() replays active sounds', async () => {
    const { result } = await renderUseSound();
    await triggerPlay(result);

    act(() => {
      result.current.pause();
    });
    act(() => {
      result.current.resume();
    });
    // resume calls unlockAudioContext().then(...) — flush its microtasks
    await act(async () => {});

    expect(mockHowl.play).toHaveBeenCalledTimes(2);
    expect(mockHowl.play).toHaveBeenLastCalledWith(1);
  });

  it('cleanup on unmount stops and frees sound', async () => {
    const { result, unmount } = await renderUseSound();
    await triggerPlay(result);

    unmount();

    expect(mockHowl.stop).toHaveBeenCalled();
    expect(freeSound).toHaveBeenCalled();
  });
});

describe('useSoundOnChange', () => {
  it('plays sound when value changes', async () => {
    const { rerender } = renderHook(
      ({ value }) => useSoundOnChange('ui/toggle_on', value),
      { initialProps: { value: 'a' } }
    );
    await act(async () => {});

    rerender({ value: 'b' });

    await vi.waitFor(() => {
      expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    });
  });

  it('skips initial render when initial: false', async () => {
    renderHook(() =>
      useSoundOnChange('ui/toggle_on', 'a', { initial: false })
    );
    await act(async () => {});

    expect(mockHowl.play).not.toHaveBeenCalled();
  });

  it('plays on initial render by default', async () => {
    renderHook(() => useSoundOnChange('ui/toggle_on', 'a'));
    await act(async () => {});

    await vi.waitFor(() => {
      expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    });
  });
});

describe('useSoundEnabled', () => {
  it('throws without SoundProvider', () => {
    expect(() => {
      renderHook(() => useSoundEnabled());
    }).toThrow();
  });
});
