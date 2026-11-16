import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('howler', async () => {
  const { createMockHowl } = await import('./mocks');
  return {
    Howl: vi.fn().mockImplementation(() => createMockHowl()),
    Howler: { ctx: { state: 'running' }, noAudio: false },
  };
});

import {
  fetchSoundBlob,
  getLocalSoundPath,
  registerSounds,
  resolveSoundUrl,
  setCDNUrl,
  __resetForTesting,
} from '../../src/runtime';
import { joinUrl, SoundPack } from '../../src/packs';

const blob = new Blob(['audio'], { type: 'audio/mpeg' });
const ok = () => ({ ok: true, status: 200, blob: () => Promise.resolve(blob), headers: new Headers() });

const pack: SoundPack = {
  name: 'my-ui-pack',
  version: '3',
  baseUrl: 'https://cdn.example.com',
  sounds: {
    save: { src: 's/k3x9p2-a81f.mp3', duration: 0.18 },
    'nested/delete': { src: 's/p8q2zz-19c0.mp3' },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  __resetForTesting();
});

describe('joinUrl', () => {
  it('joins relative paths and keeps absolute ones', () => {
    expect(joinUrl('https://cdn.example.com/', './a.mp3')).toBe('https://cdn.example.com/a.mp3');
    expect(joinUrl('https://cdn.example.com', 's/a.mp3')).toBe('https://cdn.example.com/s/a.mp3');
    expect(joinUrl('https://cdn.example.com', 'https://other.com/a.mp3')).toBe('https://other.com/a.mp3');
    expect(joinUrl('https://cdn.example.com', '/root/a.mp3')).toBe('/root/a.mp3');
  });
});

describe('registerSounds', () => {
  it('resolves pack sounds against the pack baseUrl', () => {
    registerSounds(pack);
    expect(resolveSoundUrl('my-ui-pack/save')).toBe('https://cdn.example.com/s/k3x9p2-a81f.mp3');
    expect(resolveSoundUrl('my-ui-pack/nested/delete')).toBe('https://cdn.example.com/s/p8q2zz-19c0.mp3');
  });

  it('lets options.baseUrl override the pack baseUrl', () => {
    registerSounds(pack, { baseUrl: 'https://my-cdn.com/packs/ui/' });
    expect(resolveSoundUrl('my-ui-pack/save')).toBe('https://my-cdn.com/packs/ui/s/k3x9p2-a81f.mp3');
  });

  it('defaults baseUrl to /sounds/<pack name>', () => {
    registerSounds({ name: 'local', sounds: { click: { src: 'click.mp3' } } });
    expect(resolveSoundUrl('local/click')).toBe('/sounds/local/click.mp3');
  });

  it('ignores sounds that collide with built-in sounds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerSounds({ name: 'ui', baseUrl: 'https://evil.example.com', sounds: { toggle_on: { src: 'x.mp3' } } });
    expect(resolveSoundUrl('ui/toggle_on')).not.toContain('evil.example.com');
    expect(warn).toHaveBeenCalled();
  });

  it('rejects invalid packs', () => {
    expect(() => registerSounds({ name: 'a/b', sounds: {} })).toThrow(/invalid pack name/);
    expect(() => registerSounds({ name: 'ok' } as unknown as SoundPack)).toThrow(/sounds/);
  });

  it('skips sounds without src', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerSounds({ name: 'p', sounds: { broken: {} as never } });
    expect(resolveSoundUrl('p/broken')).toBe('p/broken');
  });

  it('does not affect built-in sounds or setCDNUrl', () => {
    registerSounds(pack);
    setCDNUrl('https://mirror.example.com');
    expect(resolveSoundUrl('ui/toggle_on')).toMatch(/^https:\/\/mirror\.example\.com\/ui\/toggle_on/);
  });
});

describe('fetchSoundBlob with packs', () => {
  it('prefers a locally downloaded copy, then the pack URL', async () => {
    registerSounds(pack);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, headers: new Headers() }) // local HEAD: missing
      .mockResolvedValueOnce(ok()); // pack URL
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSoundBlob('my-ui-pack/save')).resolves.toBe(blob);
    expect(fetchMock.mock.calls[0][0]).toBe('/sounds/my-ui-pack/save.mp3');
    expect(fetchMock.mock.calls[1][0]).toBe('https://cdn.example.com/s/k3x9p2-a81f.mp3');
  });

  it('uses the local copy when present', async () => {
    registerSounds(pack);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'audio/mpeg' }) }) // HEAD
      .mockResolvedValueOnce(ok()); // GET local
    vi.stubGlobal('fetch', fetchMock);

    await fetchSoundBlob('my-ui-pack/save');
    expect(fetchMock.mock.calls[1][0]).toBe('/sounds/my-ui-pack/save.mp3');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetches vendored packs only once', async () => {
    registerSounds({ name: 'local', baseUrl: '/sounds/local', sounds: { click: { src: 'click.mp3' } } });
    expect(await getLocalSoundPath('local/click')).toBeNull();
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal('fetch', fetchMock);

    await fetchSoundBlob('local/click');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/sounds/local/click.mp3');
  });

  it('reports the URL when a pack sound fails to load', async () => {
    registerSounds({ name: 'local', sounds: { click: { src: 'click.mp3' } } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() }));
    await expect(fetchSoundBlob('local/click')).rejects.toThrow('/sounds/local/click.mp3 (HTTP 404)');
  });

  it('refetches a sound after its pack URL changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal('fetch', fetchMock);
    registerSounds({ name: 'local', baseUrl: '/sounds/local', sounds: { click: { src: 'v1.mp3' } } });
    await fetchSoundBlob('local/click');
    registerSounds({ name: 'local', baseUrl: '/sounds/local', sounds: { click: { src: 'v2.mp3' } } });
    expect(resolveSoundUrl('local/click')).toBe('/sounds/local/v2.mp3');
  });
});

describe('fetchSoundBlob with URLs', () => {
  it('loads a full URL directly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    vi.stubGlobal('fetch', fetchMock);
    const url = 'https://cdn.openfoley.com/s/k3x9p2-a81f.mp3';
    await expect(fetchSoundBlob(url)).resolves.toBe(blob);
    expect(fetchMock).toHaveBeenCalledWith(url);
    expect(resolveSoundUrl(url)).toBe(url);
  });

  it('mentions CORS when a URL fails to load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchSoundBlob('https://other.example.com/a.mp3')).rejects.toThrow(/CORS/);
  });
});
