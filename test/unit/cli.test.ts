// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFile } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

const CLI = path.resolve(__dirname, '../../bin/react-sounds-cli.js');
const MP3 = Buffer.from('ID3fake-mp3-data');

function run(args: string[], cwd: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile('node', [CLI, ...args], { cwd }, (err, stdout, stderr) => {
      resolve({ code: err ? (err as NodeJS.ErrnoException & { code: number }).code ?? 1 : 0, out: stdout + stderr });
    });
  });
}

let server: http.Server;
let origin: string;
let cors = true;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const headers: Record<string, string> = cors ? { 'access-control-allow-origin': '*' } : {};
    if (req.url === '/c/ui-pack' || req.url === '/c/ui-pack/') {
      res.writeHead(200, { 'content-type': 'text/html', ...headers });
      return res.end('<html>collection page</html>');
    }
    if (req.url === '/c/ui-pack/manifest.json') {
      res.writeHead(200, { 'content-type': 'application/json', ...headers });
      return res.end(
        JSON.stringify({ name: 'ui-pack', version: '2', sounds: { save: { src: 'files/save.mp3' }, 'menu/open': { src: 'files/open.mp3' } } })
      );
    }
    if (req.url?.startsWith('/c/ui-pack/files/')) {
      res.writeHead(200, { 'content-type': 'audio/mpeg', ...headers });
      return res.end(req.method === 'HEAD' ? undefined : MP3);
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

let cwd: string;
beforeEach(() => {
  cors = true;
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'react-sounds-cli-'));
});

const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(cwd, p), 'utf8'));

describe('react-sounds-cli add', () => {
  it('adds a remote pack from a collection URL and writes manifest + types', async () => {
    const { code, out } = await run(['add', `${origin}/c/ui-pack`], cwd);
    expect(code).toBe(0);
    expect(out).toContain('Added "ui-pack" v2 with 2 sounds');

    const pack = readJson('src/sounds/ui-pack.json');
    expect(pack.baseUrl).toBe(`${origin}/c/ui-pack/`);
    expect(pack.source).toBe(`${origin}/c/ui-pack`);
    expect(pack.sounds.save.src).toBe('files/save.mp3');

    const types = fs.readFileSync(path.join(cwd, 'src/sounds/ui-pack.sounds.d.ts'), 'utf8');
    expect(types).toContain('"ui-pack/save": true;');
    expect(types).toContain('"ui-pack/menu/open": true;');
    expect(types).toContain('declare module "react-sounds"');
  });

  it('warns when the host does not send CORS headers', async () => {
    cors = false;
    const { code, out } = await run(['add', `${origin}/c/ui-pack/manifest.json`], cwd);
    expect(code).toBe(0);
    expect(out).toContain('Access-Control-Allow-Origin');
  });

  it('downloads the files into the app with --download', async () => {
    const { code } = await run(['add', `${origin}/c/ui-pack`, '--download', '--dir', 'app/sounds'], cwd);
    expect(code).toBe(0);
    const pack = readJson('app/sounds/ui-pack.json');
    expect(pack.baseUrl).toBe('/sounds/ui-pack');
    expect(pack.sounds['menu/open'].src).toBe('menu/open.mp3');
    expect(fs.readFileSync(path.join(cwd, 'public/sounds/ui-pack/menu/open.mp3'))).toEqual(MP3);
  });

  it('fails clearly for a local manifest without baseUrl unless --download is used', async () => {
    fs.mkdirSync(path.join(cwd, 'mine'));
    fs.writeFileSync(path.join(cwd, 'mine/click.mp3'), MP3);
    fs.writeFileSync(path.join(cwd, 'mine/manifest.json'), JSON.stringify({ name: 'mine', sounds: { click: { src: 'click.mp3' } } }));

    const failed = await run(['add', 'mine'], cwd);
    expect(failed.code).not.toBe(0);
    expect(failed.out).toContain('--base-url');

    const ok = await run(['add', 'mine', '--download'], cwd);
    expect(ok.code).toBe(0);
    expect(fs.existsSync(path.join(cwd, 'public/sounds/mine/click.mp3'))).toBe(true);
  });

  it('rejects files that are not sound packs', async () => {
    fs.writeFileSync(path.join(cwd, 'bad.json'), JSON.stringify({ hello: 'world' }));
    const { code, out } = await run(['add', 'bad.json'], cwd);
    expect(code).not.toBe(0);
    expect(out).toContain('not a sound pack manifest');
  });
});

describe('react-sounds-cli pack', () => {
  it('creates a manifest for a folder of MP3s', async () => {
    fs.mkdirSync(path.join(cwd, 'My Sounds/menu'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'My Sounds/click.mp3'), MP3);
    fs.writeFileSync(path.join(cwd, 'My Sounds/menu/open.mp3'), MP3);
    fs.writeFileSync(path.join(cwd, 'My Sounds/readme.txt'), 'ignored');

    const { code } = await run(['pack', 'My Sounds', '--base-url', 'https://cdn.example.com/my'], cwd);
    expect(code).toBe(0);
    const manifest = readJson('My Sounds/manifest.json');
    expect(manifest).toEqual({
      name: 'my-sounds',
      version: '1',
      baseUrl: 'https://cdn.example.com/my',
      sounds: { click: { src: 'click.mp3' }, 'menu/open': { src: 'menu/open.mp3' } },
    });
  });
});

describe('react-sounds-cli pick', () => {
  it('downloads sounds from added packs for offline use', async () => {
    await run(['add', `${origin}/c/ui-pack`], cwd);
    const { code, out } = await run(['pick', 'ui-pack/save', '--output', 'public/sounds'], cwd);
    // pick loads the library manifest from dist/, which only exists after a build
    if (!fs.existsSync(path.resolve(__dirname, '../../dist/manifest.json'))) return;
    expect(out).toContain('Downloaded: ui-pack/save');
    expect(code).toBe(0);
    expect(fs.readFileSync(path.join(cwd, 'public/sounds/ui-pack/save.mp3'))).toEqual(MP3);
  });
});
