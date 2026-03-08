import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import { createMockHowl } from './mocks';

vi.mock('../../src/runtime', async () => {
  const { createRuntimeMock } = await import('./mocks');
  return createRuntimeMock();
});

import { SoundProvider, SoundButton, Sound } from '../../src/components';
import { useSoundEnabled } from '../../src/hooks';
import { claimSound, isSoundEnabled, preloadSounds, playSound } from '../../src/runtime';

let mockHowl: ReturnType<typeof createMockHowl>;

beforeEach(() => {
  vi.clearAllMocks();
  mockHowl = createMockHowl();
  vi.mocked(isSoundEnabled).mockReturnValue(true);
  vi.mocked(claimSound).mockResolvedValue(mockHowl);
});

describe('SoundProvider', () => {
  it('renders children', async () => {
    const { getByText } = render(
      <SoundProvider>
        <span>hello</span>
      </SoundProvider>
    );
    await act(async () => {});
    expect(getByText('hello')).toBeTruthy();
  });

  it('provides context so useSoundEnabled does not throw', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SoundProvider>{children}</SoundProvider>
    );
    const { result } = renderHook(() => useSoundEnabled(), { wrapper });
    await act(async () => {});
    const [enabled, setEnabled] = result.current;
    expect(typeof enabled).toBe('boolean');
    expect(typeof setEnabled).toBe('function');
  });

  it('preload prop calls preloadSounds with the provided array', async () => {
    const sounds = ['ui/toggle_on', 'ui/toggle_off'];
    render(
      <SoundProvider preload={sounds}>
        <span>child</span>
      </SoundProvider>
    );
    await act(async () => {});
    expect(preloadSounds).toHaveBeenCalledWith(sounds);
  });

  it('initialEnabled={false} causes useSoundEnabled to return false', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SoundProvider initialEnabled={false}>{children}</SoundProvider>
    );
    const { result } = renderHook(() => useSoundEnabled(), { wrapper });
    await act(async () => {});
    const [enabled] = result.current;
    expect(enabled).toBe(false);
  });
});

describe('SoundButton', () => {
  it('renders a button and plays sound on click', async () => {
    const { getByText } = render(
      <SoundButton sound="ui/toggle_on">Click me</SoundButton>
    );
    await act(async () => {});
    const button = getByText('Click me');
    expect(button.tagName).toBe('BUTTON');

    await act(async () => {
      fireEvent.click(button);
    });
    await vi.waitFor(() => {
      expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    });
  });

  it('user-provided onClick fires alongside sound playback', async () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <SoundButton sound="ui/toggle_on" onClick={onClick}>Click me</SoundButton>
    );
    await act(async () => {});

    await act(async () => {
      fireEvent.click(getByText('Click me'));
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    });
  });
});

describe('Sound', () => {
  it('renders children', async () => {
    const { getByText } = render(
      <Sound name="ui/toggle_on">
        <span>child</span>
      </Sound>
    );
    await act(async () => {});
    expect(getByText('child')).toBeTruthy();
  });

  it('plays on mount when trigger="mount"', async () => {
    const endCallbacks: Array<(id: number) => void> = [];
    const autoEndHowl = createMockHowl();
    autoEndHowl.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'end') endCallbacks.push(cb as (id: number) => void);
    });
    autoEndHowl.play.mockImplementation(() => {
      queueMicrotask(() => endCallbacks.forEach((cb) => cb(1)));
      return 1;
    });
    vi.mocked(claimSound).mockResolvedValue(autoEndHowl);

    await act(async () => {
      render(<Sound name="ui/toggle_on" trigger="mount" />);
    });

    expect(claimSound).toHaveBeenCalledWith('ui/toggle_on');
    expect(autoEndHowl.play).toHaveBeenCalled();
  });

  it('calls onLoad when sound loads', async () => {
    const onLoad = vi.fn();
    render(<Sound name="ui/toggle_on" onLoad={onLoad} />);
    await act(async () => {});

    await vi.waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('does not auto-play when trigger="none"', async () => {
    render(<Sound name="ui/toggle_on" trigger="none" />);
    await act(async () => {});

    expect(mockHowl.play).not.toHaveBeenCalled();
  });

  it('calls playSound on unmount when trigger="unmount"', async () => {
    const { unmount } = render(<Sound name="ui/toggle_on" trigger="unmount" />);
    await act(async () => {});

    unmount();

    expect(playSound).toHaveBeenCalledWith('ui/toggle_on', undefined);
  });
});
