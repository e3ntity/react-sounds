#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

// Load the manifest
const manifestPath = path.join(__dirname, "../dist/manifest.json");
let manifest;

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (err) {
  console.error("Error loading manifest:", err.message);
  process.exit(1);
}

// Get the CDN base URL
const cdnBaseUrl = process.env.REACT_SOUNDS_CDN || "https://reactsounds.sfo3.cdn.digitaloceanspaces.com/v1";

// Parse command line arguments
const args = process.argv.slice(2);
let command = args[0];
let soundNames = [];
let outputDir = "./public/sounds";

if (command === "pick") {
  soundNames = args.slice(1).filter((arg) => !arg.startsWith("--"));

  // Check for output directory option
  const outputOption = args.find((arg) => arg.startsWith("--output="));
  if (outputOption) {
    outputDir = outputOption.split("=")[1];
  } else {
    const outputIndex = args.indexOf("--output");
    if (outputIndex !== -1 && args[outputIndex + 1]) {
      outputDir = args[outputIndex + 1];
    }
  }

  if (soundNames.length === 0) {
    console.error("Please specify at least one sound to pick.");
    console.log("Usage: npx react-sounds-cli pick <sound-names...> [--output=<dir>]");
    process.exit(1);
  }

  // Create output directory
  try {
    fs.mkdirSync(outputDir, { recursive: true });

    // Create category subdirectories
    const categories = ["ui", "notification", "game"];
    for (const category of categories) {
      fs.mkdirSync(path.join(outputDir, category), { recursive: true });
    }
  } catch (err) {
    console.error(`Error creating directory ${outputDir}:`, err.message);
    process.exit(1);
  }

  console.log(`\n📦 Downloading ${soundNames.length} sounds to ${outputDir}...`);

  // Download each sound
  let successCount = 0;
  let failCount = 0;

  const downloadPromises = soundNames.map((name) => {
    return new Promise((resolve) => {
      // Check if sound exists in manifest
      if (!manifest.sounds[name]) {
        console.error(`❌ Sound "${name}" not found in manifest.`);
        failCount++;
        resolve();
        return;
      }

      const soundInfo = manifest.sounds[name];
      const cdnPath = soundInfo.src;
      const targetPath = path.join(outputDir, name + ".mp3");

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      fs.mkdirSync(targetDir, { recursive: true });

      // Download the file
      const file = fs.createWriteStream(targetPath);
      const url = `${cdnBaseUrl}/${cdnPath}`;

      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            console.error(`❌ Failed to download "${name}": HTTP ${response.statusCode}`);
            failCount++;
            resolve();
            return;
          }

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            console.log(`✅ Downloaded: ${name}`);
            successCount++;
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(targetPath, () => {}); // Clean up on error
          console.error(`❌ Failed to download "${name}":`, err.message);
          failCount++;
          resolve();
        });
    });
  });

  Promise.all(downloadPromises).then(() => {
    console.log("\n📊 Summary:");
    console.log(`✅ ${successCount} sounds downloaded successfully`);

    if (failCount > 0) {
      console.log(`❌ ${failCount} sounds failed to download`);
    }

    console.log("\n🔧 Sounds are now available for offline use!");
    console.log("To use them in your project, set the CDN base URL:");
    console.log("\nimport { setCDNUrl } from 'react-sounds';");
    console.log(`setCDNUrl('${path.relative(process.cwd(), outputDir)}');\n`);
  });
} else if (command === "list") {
  // List all available sounds
  console.log("\n🔊 Available sounds:\n");

  const categories = {};

  // Group sounds by category
  for (const name in manifest.sounds) {
    const category = name.split("/")[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(name);
  }

  // Print grouped sounds
  for (const category in categories) {
    console.log(`📁 ${category}:`);
    for (const name of categories[category]) {
      console.log(`  - ${name}`);
    }
    console.log("");
  }
} else {
  // Show help
  console.log("\n🔊 react-sounds-cli");
  console.log("A CLI for managing sounds in the react-sounds library.\n");
  console.log("Commands:");
  console.log("  pick <sound-names...> [--output=<dir>]  Download sounds for offline use");
  console.log("  list                                   List all available sounds\n");
  console.log("Examples:");
  console.log("  npx react-sounds-cli pick ui/click ui/hover notification/success");
  console.log("  npx react-sounds-cli pick ui/click --output=./public/sounds");
  console.log("  npx react-sounds-cli list\n");
}
