#!/usr/bin/env node

/**
 * This script generates a manifest.json file by scanning the sounds directory
 * and collecting metadata about each sound file.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

// Configuration
const SOUNDS_DIR = path.resolve(__dirname, "../sounds");
const OUTPUT_DIR = path.resolve(__dirname, "../src");
const MANIFEST_FILE = path.join(OUTPUT_DIR, "manifest.json");
const KEYWORDS_FILE = path.join(SOUNDS_DIR, "keywords.json");

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate a hash for a file
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("md5");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex").substring(0, 7);
}

// Get all valid category directories
function getCategories() {
  const items = fs.readdirSync(SOUNDS_DIR, { withFileTypes: true });
  return items.filter((item) => item.isDirectory() && item.name !== ".DS_Store").map((item) => item.name);
}

// Main function
async function generateManifest() {
  console.log("Generating manifest...");

  const manifest = {
    version: "1.0.0",
    sounds: {},
  };

  // Get all categories from the sounds directory
  const categories = getCategories();
  console.log(`Found categories: ${categories.join(", ")}`);

  // Iterate through all categories and sound files
  for (const category of categories) {
    const categoryPath = path.join(SOUNDS_DIR, category);

    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      // Only process MP3 files
      if (!file.endsWith(".mp3")) continue;

      const filePath = path.join(categoryPath, file);
      const soundName = file.replace(".mp3", "");
      const soundId = `${category}/${soundName}`;

      // Generate hash for the file
      const hash = generateFileHash(filePath);

      // Get file metadata (duration, etc.)
      let duration = 0;

      try {
        // Try to get audio duration using ffprobe if available
        const result = execSync(`ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`, {
          encoding: "utf8",
        });
        duration = parseFloat(result.trim());
      } catch (e) {
        console.warn(`Could not get duration for ${filePath}. Setting default duration.`);
        // Set a default duration based on file size
        const stats = fs.statSync(filePath);
        duration = Math.round((stats.size / 16000) * 10) / 10; // Rough estimate
      }

      // Add to manifest
      manifest.sounds[soundId] = {
        src: `${category}/${soundName}.${hash}.mp3`,
        duration: duration,
      };

      console.log(`Added ${soundId} to manifest`);
    }
  }

  // Warn about keywords for sounds that don't exist (e.g. after a rename)
  if (fs.existsSync(KEYWORDS_FILE)) {
    const keywords = JSON.parse(fs.readFileSync(KEYWORDS_FILE, "utf8"));
    const unknown = Object.keys(keywords).filter((soundId) => !manifest.sounds[soundId]);
    if (unknown.length > 0) {
      console.warn(`keywords.json has entries for unknown sounds: ${unknown.join(", ")}`);
    }
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Manifest saved to ${MANIFEST_FILE}`);
}

// Run the script
generateManifest().catch((err) => {
  console.error("Error generating manifest:", err);
  process.exit(1);
});
