// Writes dist/<path>/index.html for every page with its own head and its rendered content, so crawlers see the
// page without running the app (most AI crawlers don't). Also writes 404.html, sitemap.xml, robots.txt and llms-full.txt.
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { site, pages } = JSON.parse(readFileSync(join(root, "src/pages.json"), "utf8"));
const template = readFileSync(join(dist, "index.html"), "utf8");
const { render } = await import(join(root, "dist-ssr/entry-server.js"));
const withContent = (html, path) => replaceOnce(html, '<div id="root"></div>', `<div id="root">${render(path)}</div>`, "root element");

const escape = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function replaceOnce(html, pattern, value, what) {
  if (typeof pattern === "string" ? !html.includes(pattern) : !pattern.test(html)) throw new Error(`prerender: ${what} not found in index.html`);
  return html.replace(pattern, () => value);
}

for (const page of pages) {
  const url = site + (page.path === "/" ? "" : page.path);
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`, "title");
  html = replaceOnce(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escape(page.description)}" />`, "description");
  html = replaceOnce(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${escape(page.title)}" />`, "og:title");
  html = replaceOnce(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escape(page.description)}" />`, "og:description");
  html = replaceOnce(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`, "og:url");
  html = replaceOnce(html, /<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`, "canonical");
  html = withContent(html, page.path);
  if (page.guide) {
    html = html.replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="article" />');
    const article = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: page.heading,
      description: page.description,
      datePublished: page.date,
      author: { "@type": "Person", name: "Lukas Schneider", url: "https://www.luschneider.com" },
      mainEntityOfPage: url,
    };
    html = html.replace("</head>", `  <script type="application/ld+json">${JSON.stringify(article)}</script>\n  </head>`);
  }
  const file = page.path === "/" ? join(dist, "index.html") : join(dist, page.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Served by the host for unknown paths, with a 404 status
let notFound = withContent(template, "/404");
notFound = replaceOnce(notFound, /<title>[\s\S]*?<\/title>/, "<title>Page not found | react-sounds</title>", "title");
notFound = replaceOnce(notFound, /<link\s+rel="canonical"[\s\S]*?\/>/, '<meta name="robots" content="noindex" />', "canonical");
writeFileSync(join(dist, "404.html"), notFound);

// Everything an AI assistant needs to answer questions about react-sounds, in one plain text file
const manifest = JSON.parse(readFileSync(join(root, "src/manifest.json"), "utf8"));
const names = Object.keys(manifest.sounds ?? manifest).sort();
const byCategory = new Map();
for (const n of names) byCategory.set(n.split("/")[0], [...(byCategory.get(n.split("/")[0]) ?? []), n]);
const soundList = [...byCategory].map(([category, list]) => `- ${category}: ${list.map((n) => `\`${n}\``).join(", ")}`).join("\n");
const readme = readFileSync(join(root, "../README.md"), "utf8").replace(/<p align="center">[\s\S]*?<\/p>\n*/g, "");
writeFileSync(join(dist, "llms-full.txt"), `${readme.trim()}\n\n## Built-in sound names\n\nUse these with \`useSound("<name>")\`. Preview them at ${site}/sounds.\n\n${soundList}\n`);

const urls = pages
  .map((p) => `  <url><loc>${site}${p.path === "/" ? "" : p.path}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ""}</url>`)
  .join("\n");
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`prerendered ${pages.length} pages and 404.html`);
