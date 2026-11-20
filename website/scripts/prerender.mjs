// Writes dist/<path>/index.html for every page with its own title, description and canonical URL,
// so crawlers see the right head without running the app. Also writes sitemap.xml and robots.txt.
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { site, pages } = JSON.parse(readFileSync(join(root, "src/pages.json"), "utf8"));
const template = readFileSync(join(dist, "index.html"), "utf8");

const escape = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function replaceOnce(html, pattern, value, what) {
  if (!pattern.test(html)) throw new Error(`prerender: ${what} not found in index.html`);
  return html.replace(pattern, value);
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

const urls = pages
  .map((p) => `  <url><loc>${site}${p.path === "/" ? "" : p.path}</loc>${p.date ? `<lastmod>${p.date}</lastmod>` : ""}</url>`)
  .join("\n");
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`prerendered ${pages.length} pages`);
