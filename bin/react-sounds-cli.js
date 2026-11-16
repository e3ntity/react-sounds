#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const cdnBaseUrl = process.env.REACT_SOUNDS_CDN || "https://reactsounds.sfo3.cdn.digitaloceanspaces.com/v1";
const PACK_NAME = /^[a-z0-9][a-z0-9._-]*$/i;
const DEFAULTS = { output: "./public/sounds", dir: "src/sounds", public: "public/sounds", "public-url": "/sounds" };
const VALUE_FLAGS = new Set([...Object.keys(DEFAULTS), "base-url", "name", "out"]);

// ---------- helpers ----------

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [key, value] = arg.slice(2).split(/=(.*)/s);
    if (value !== undefined) flags[key] = value;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--") && VALUE_FLAGS.has(key)) flags[key] = argv[++i];
    else flags[key] = true;
  }
  return { positional, flags };
}

let libraryManifest;
function loadLibraryManifest() {
  if (libraryManifest) return libraryManifest;
  const manifestPath = path.join(__dirname, "../dist/manifest.json");
  try {
    libraryManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    console.error("Error loading manifest:", err.message);
    process.exit(1);
  }
  return libraryManifest;
}

const isRemote = (s) => /^https?:\/\//i.test(s);

function joinUrl(baseUrl, src) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("/")) return src;
  return `${baseUrl.replace(/\/+$/, "")}/${src.replace(/^\.\//, "")}`;
}

function request(url, { method = "GET", headers = {} } = {}, redirects = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.request(url, { method, headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(request(new URL(res.headers.location, url).href, { method, headers }, redirects - 1));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function readSource(source) {
  if (isRemote(source)) {
    const res = await request(source, { headers: { accept: "application/json, */*" } });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${source}`);
    return res.body;
  }
  return fs.readFileSync(source);
}

function validatePack(pack, where) {
  if (!pack || typeof pack !== "object" || !pack.sounds || typeof pack.sounds !== "object") {
    throw new Error(`${where} is not a sound pack manifest (missing "sounds")`);
  }
  if (typeof pack.name !== "string" || !PACK_NAME.test(pack.name)) {
    throw new Error(`${where} has an invalid pack name "${pack.name}" (letters, numbers, ".", "_", "-", no "/")`);
  }
  for (const [key, sound] of Object.entries(pack.sounds)) {
    if (!sound || typeof sound.src !== "string" || !sound.src) throw new Error(`Sound "${key}" has no src`);
  }
  return pack;
}

/**
 * Load a pack manifest from a URL, a manifest file, or a directory containing manifest.json.
 * For URLs that don't return JSON (e.g. a collection page), "<url>/manifest.json" is tried.
 */
async function loadPack(source) {
  const candidates = [];
  if (isRemote(source)) {
    candidates.push(source);
    if (!/\.json($|\?)/.test(source)) candidates.push(`${source.replace(/\/+$/, "")}/manifest.json`);
  } else {
    const resolved = path.resolve(source);
    candidates.push(fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? path.join(resolved, "manifest.json") : resolved);
  }

  let lastError;
  for (const location of candidates) {
    try {
      const pack = JSON.parse((await readSource(location)).toString("utf8"));
      return { pack: validatePack(pack, location), location };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Where the files of a pack loaded from `location` live, or null if unknown */
function packFilesBase(pack, location, overrideBaseUrl) {
  if (overrideBaseUrl) return overrideBaseUrl;
  if (pack.baseUrl) return pack.baseUrl;
  if (isRemote(location)) return new URL(".", location).href;
  return null;
}

async function copyOrDownload(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (isRemote(from)) {
    const res = await request(from);
    if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${from}`);
    fs.writeFileSync(to, res.body);
  } else {
    fs.copyFileSync(from, to);
  }
}

const toIdentifier = (name) => name.replace(/[^a-z0-9]+(.)?/gi, (_, c) => (c ? c.toUpperCase() : "")).replace(/^[0-9]/, "_$&");

function typesFor(pack) {
  const names = Object.keys(pack.sounds).map((key) => `    ${JSON.stringify(`${pack.name}/${key}`)}: true;`);
  return [
    "// Generated by react-sounds-cli. Do not edit; run `react-sounds-cli add` again to update.",
    "export {};",
    "",
    'declare module "react-sounds" {',
    "  interface CustomSoundNames {",
    ...names,
    "  }",
    "}",
    "",
  ].join("\n");
}

function findLocalPacks(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return validatePack(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), f);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function listMp3s(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMp3s(full, base);
    return entry.name.toLowerCase().endsWith(".mp3") ? [path.relative(base, full).split(path.sep).join("/")] : [];
  });
}

// ---------- commands ----------

async function pick(names, flags) {
  if (names.length === 0) {
    console.error("Please specify at least one sound to pick.");
    console.log("Usage: npx react-sounds-cli pick <sound-names...> [--output=<dir>]");
    process.exit(1);
  }
  const outputDir = flags.output || DEFAULTS.output;
  const manifest = loadLibraryManifest();
  const packs = findLocalPacks(flags.dir || DEFAULTS.dir);

  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`\n📦 Downloading ${names.length} sounds to ${outputDir}...`);

  let successCount = 0;
  let failCount = 0;

  await Promise.all(
    names.map(async (name) => {
      let url;
      if (manifest.sounds[name]) {
        url = `${cdnBaseUrl}/${manifest.sounds[name].src}`;
      } else {
        const pack = packs.find((p) => name.startsWith(`${p.name}/`) && p.sounds[name.slice(p.name.length + 1)]);
        if (!pack) {
          console.error(`❌ Sound "${name}" not found in the library or in packs in ${flags.dir || DEFAULTS.dir}.`);
          failCount++;
          return;
        }
        url = joinUrl(pack.baseUrl || `/sounds/${pack.name}`, pack.sounds[name.slice(pack.name.length + 1)].src);
        if (!isRemote(url)) {
          console.log(`✅ Already local: ${name} (${url})`);
          successCount++;
          return;
        }
      }

      try {
        await copyOrDownload(url, path.join(outputDir, `${name}.mp3`));
        console.log(`✅ Downloaded: ${name}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to download "${name}":`, err.message);
        failCount++;
      }
    })
  );

  console.log("\n📊 Summary:");
  console.log(`✅ ${successCount} sounds downloaded successfully`);
  if (failCount > 0) console.log(`❌ ${failCount} sounds failed to download`);
  console.log("\n🔧 Sounds are now available for offline use!");
  console.log("To use them in your project, set the CDN base URL:");
  console.log("\nimport { setCDNUrl } from 'react-sounds';");
  console.log(`setCDNUrl('${path.relative(process.cwd(), outputDir)}');\n`);
  if (failCount > 0) process.exitCode = 1;
}

function list() {
  const manifest = loadLibraryManifest();
  console.log("\n🔊 Available sounds:\n");
  const categories = {};
  for (const name in manifest.sounds) {
    const category = name.split("/")[0];
    (categories[category] = categories[category] || []).push(name);
  }
  for (const category in categories) {
    console.log(`📁 ${category}:`);
    for (const name of categories[category]) console.log(`  - ${name}`);
    console.log("");
  }
}

async function add(source, flags) {
  if (!source) {
    console.error("Usage: npx react-sounds-cli add <manifest-url-or-path> [--download] [--dir=src/sounds]");
    process.exit(1);
  }
  const dir = flags.dir || DEFAULTS.dir;
  const { pack, location } = await loadPack(source);
  const filesBase = packFilesBase(pack, location, typeof flags["base-url"] === "string" ? flags["base-url"] : null);
  const out = { ...pack, source: isRemote(source) ? source : pack.source, sounds: {} };

  if (flags.download) {
    const publicDir = flags.public || DEFAULTS.public;
    const publicUrl = (flags["public-url"] || DEFAULTS["public-url"]).replace(/\/+$/, "");
    const localBase = filesBase || path.dirname(location);
    console.log(`\n📦 Downloading ${Object.keys(pack.sounds).length} sounds of "${pack.name}" to ${publicDir}/${pack.name}...`);
    for (const [key, sound] of Object.entries(pack.sounds)) {
      const from = isRemote(localBase) || isRemote(sound.src) ? joinUrl(localBase, sound.src) : path.resolve(localBase, sound.src);
      await copyOrDownload(from, path.join(publicDir, pack.name, `${key}.mp3`));
      out.sounds[key] = { ...sound, src: `${key}.mp3` };
    }
    out.baseUrl = `${publicUrl}/${pack.name}`;
  } else {
    if (!filesBase) {
      console.error(`❌ ${location} has no baseUrl, so its files can't be located.`);
      console.error("   Pass --base-url=<where the files are hosted> or --download to copy them into your app.");
      process.exit(1);
    }
    out.baseUrl = filesBase;
    Object.assign(out.sounds, pack.sounds);
    await warnAboutHosting(out);
  }

  for (const [key, sound] of Object.entries(pack.sounds)) {
    if (!/\.mp3($|\?)/i.test(sound.src)) console.warn(`⚠️  "${pack.name}/${key}" is not an .mp3 file; react-sounds plays MP3 only.`);
  }

  fs.mkdirSync(dir, { recursive: true });
  const jsonPath = path.join(dir, `${pack.name}.json`);
  const typesPath = path.join(dir, `${pack.name}.sounds.d.ts`);
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n");
  fs.writeFileSync(typesPath, typesFor(out));

  const first = Object.keys(out.sounds)[0];
  const id = toIdentifier(pack.name);
  console.log(`\n✅ Added "${pack.name}"${pack.version ? ` v${pack.version}` : ""} with ${Object.keys(out.sounds).length} sounds`);
  console.log(`   ${jsonPath}\n   ${typesPath}`);
  console.log("\nRegister the pack once, near the root of your app:\n");
  console.log(`  import ${id} from "./${path.relative(process.cwd(), jsonPath).split(path.sep).join("/").replace(/^src\//, "")}";`);
  console.log(`  <SoundProvider packs={[${id}]}>...</SoundProvider>   // or: registerSounds(${id})\n`);
  if (first) console.log(`Then play its sounds by name:\n\n  useSound("${pack.name}/${first}");\n`);
}

/** Check one file of a remotely hosted pack for CORS headers, which the browser needs to load it */
async function warnAboutHosting(pack) {
  const first = Object.values(pack.sounds)[0];
  if (!first) return;
  const url = joinUrl(pack.baseUrl, first.src);
  if (!isRemote(url)) return;
  try {
    const res = await request(url, { method: "HEAD", headers: { origin: "http://localhost:3000" } });
    if (res.status >= 400) console.warn(`⚠️  ${url} returned HTTP ${res.status}.`);
    else if (!res.headers["access-control-allow-origin"]) {
      console.warn(`⚠️  ${url} has no Access-Control-Allow-Origin header; browsers on other domains won't be able to load it.`);
      console.warn("   Enable CORS on the host, or use --download to serve the files from your app.");
    }
  } catch (err) {
    console.warn(`⚠️  Could not reach ${url}: ${err.message}`);
  }
}

function pack(dir, flags) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("Usage: npx react-sounds-cli pack <directory-with-mp3s> [--name=<pack-name>] [--base-url=<url>]");
    process.exit(1);
  }
  const name = typeof flags.name === "string" ? flags.name : path.basename(path.resolve(dir)).toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  if (!PACK_NAME.test(name)) {
    console.error(`❌ Invalid pack name "${name}". Pass --name=<letters, numbers, ".", "_", "-">.`);
    process.exit(1);
  }
  const files = listMp3s(dir).sort();
  if (files.length === 0) {
    console.error(`❌ No .mp3 files found in ${dir}.`);
    process.exit(1);
  }

  const manifest = { name, version: "1", sounds: {} };
  if (typeof flags["base-url"] === "string") manifest.baseUrl = flags["base-url"];
  for (const file of files) manifest.sounds[file.replace(/\.mp3$/i, "")] = { src: file };

  const outPath = typeof flags.out === "string" ? flags.out : path.join(dir, "manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n✅ Wrote ${outPath} with ${files.length} sounds in pack "${name}".`);
  console.log("\nHost the folder anywhere that serves files with CORS headers, then in your app run:\n");
  console.log("  npx react-sounds-cli add https://<your-host>/<path>/manifest.json\n");
}

function help() {
  console.log("\n🔊 react-sounds-cli");
  console.log("A CLI for managing sounds in the react-sounds library.\n");
  console.log("Commands:");
  console.log("  pick <sound-names...> [--output=<dir>]   Download library or pack sounds for offline use");
  console.log("  list                                    List all built-in sounds");
  console.log("  add <manifest-url-or-path> [options]    Add a sound pack to your app (writes manifest + types)");
  console.log("      --dir=<dir>          Where to write the pack files (default: src/sounds)");
  console.log("      --download           Copy the sound files into your app (default dir: public/sounds)");
  console.log("      --public=<dir>       Public folder for --download (default: public/sounds)");
  console.log("      --public-url=<url>   URL of that folder (default: /sounds)");
  console.log("      --base-url=<url>     Where the pack's files are hosted, if the manifest doesn't say");
  console.log("  pack <dir> [--name=<name>] [--base-url=<url>]   Create a manifest.json for a folder of MP3s\n");
  console.log("Examples:");
  console.log("  npx react-sounds-cli pick ui/click notification/success");
  console.log("  npx react-sounds-cli add https://openfoley.com/c/my-ui-pack");
  console.log("  npx react-sounds-cli add https://openfoley.com/c/my-ui-pack --download");
  console.log("  npx react-sounds-cli pack ./my-sounds --name=my-sounds\n");
}

// ---------- main ----------

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command, ...rest] = positional;

const commands = {
  pick: () => pick(rest, flags),
  list: () => list(),
  add: () => add(rest[0], flags),
  pack: () => pack(rest[0], flags),
};

Promise.resolve((commands[command] || help)()).catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
