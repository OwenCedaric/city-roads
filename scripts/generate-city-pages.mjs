#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import siteConfig, { buildUrl, normalizeUrl } from '../site.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const DATA_FILE = path.resolve(ROOT_DIR, 'src/data/top-cities.json');

const BASE_URL = siteConfig.siteUrl;

export function loadCities() {
  const content = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(content);
}

export function generateCityHTML(city, allCities = []) {
  const pageTitle = `${city.name} Road Network Map & Minimalist Vector Poster | City Roads`;
  const metaDescription = `Explore and export every single road in ${city.name} (${city.country}) as clean vector SVG or high-resolution PNG. Discover the ${city.layoutType} cartography of ${city.name}.`;
  const canonicalUrl = buildUrl(BASE_URL, `city/${city.slug}/`);
  const interactiveUrl = `../../?q=${encodeURIComponent(city.name)}&auto=true`;

  const relatedCities = allCities
    .filter(c => c.slug !== city.slug)
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": BASE_URL ? `${buildUrl(BASE_URL, '')}#webapp` : "#webapp",
        "name": "City Roads",
        "url": buildUrl(BASE_URL, ''),
        "applicationCategory": "DesignApplication",
        "operatingSystem": "All"
      },
      {
        "@type": "Place",
        "@id": BASE_URL ? `${canonicalUrl}#place` : `#place-${city.slug}`,
        "name": city.name,
        "alternateName": city.localName,
        "containedInPlace": {
          "@type": "Country",
          "name": city.country,
          "identifier": city.countryCode
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": city.lat,
          "longitude": city.lon
        },
        "hasMap": canonicalUrl
      },
      {
        "@type": "Dataset",
        "@id": BASE_URL ? `${canonicalUrl}#dataset` : `#dataset-${city.slug}`,
        "name": `${city.name} Vector Road Network`,
        "description": `Vectorized road segments of ${city.name} extracted from OpenStreetMap, including motorways, primary, secondary, and residential streets.`,
        "license": "https://opendatacommons.org/licenses/odbl/",
        "creator": {
          "@type": "Organization",
          "name": "OpenStreetMap Contributors"
        }
      },
      {
        "@type": "FAQPage",
        "@id": BASE_URL ? `${canonicalUrl}#faq` : `#faq-${city.slug}`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How can I export ${city.name} roads as vector SVG?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Launch City Roads in your browser, load ${city.name}, and click the 'Copy SVG' or 'Download SVG' button in the export menu. You can also extract vector paths programmatically via window.cityRoads.getSVG().`
            }
          },
          {
            "@type": "Question",
            "name": `What is the urban street layout of ${city.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${city.name} primarily exhibits a ${city.layoutType}. ${city.description}`
            }
          },
          {
            "@type": "Question",
            "name": `Is the road data for ${city.name} free to use commercially?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes, the road geometries are sourced from OpenStreetMap under the Open Database License (ODbL). You may use and export the maps for personal prints or commercial design with proper OpenStreetMap attribution.`
            }
          }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="keywords" content="${city.name} road map, ${city.name} street network, ${city.name} vector SVG, ${city.name} poster, minimalist cartography, ${city.localName} 路网">
  <meta name="author" content="Owen Cedaric (original by Andrei Kashcha)">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Social Sharing -->
  <meta property="og:type" content="place">
  <meta property="og:site_name" content="City Roads">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://i.imgur.com/Fbbe5a6.png">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDescription}">
  <meta name="twitter:image" content="https://i.imgur.com/Fbbe5a6.png">

  <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <style>
    :root {
      --bg-color: #fbf9f6;
      --card-bg: #ffffff;
      --text-color: #3d4451;
      --heading-color: #2c323d;
      --accent-color: #82a1b9;
      --accent-hover: #6a8aa3;
      --border-color: #eae6df;
      --code-bg: #f3f0eb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.65;
      padding: 0 20px 60px 20px;
      -webkit-font-smoothing: antialiased;
    }
    header {
      max-width: 960px;
      margin: 40px auto 24px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--heading-color);
      font-weight: 600;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }
    .brand svg { width: 36px; height: 36px; }
    .nav-links a {
      color: var(--text-color);
      text-decoration: none;
      font-size: 0.95rem;
      margin-left: 20px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: var(--accent-hover); }
    main {
      max-width: 960px;
      margin: 0 auto;
    }
    .breadcrumb {
      font-size: 0.85rem;
      color: #8e95a5;
      margin-bottom: 16px;
    }
    .breadcrumb a { color: inherit; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .hero {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      margin-bottom: 32px;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.6rem;
      color: var(--heading-color);
      line-height: 1.2;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #eef2f5;
      color: #556275;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 20px;
      margin-bottom: 16px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .lead {
      font-size: 1.15rem;
      color: #555d6b;
      margin-bottom: 24px;
      max-width: 780px;
    }
    .action-group {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-primary {
      background-color: var(--heading-color);
      color: #ffffff;
      border: 1px solid transparent;
      box-shadow: 0 2px 6px rgba(44, 50, 61, 0.2);
    }
    .btn-primary:hover {
      background-color: #1a1e24;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: var(--code-bg);
      color: var(--heading-color);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background-color: #e9e4dc;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      h1 { font-size: 2rem; }
      .hero { padding: 24px 20px; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
    }
    .card h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      color: var(--heading-color);
      margin-bottom: 14px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border-color);
      font-size: 0.95rem;
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: #737c8d; }
    .stat-value { font-weight: 500; color: var(--heading-color); text-align: right; }
    pre {
      background: var(--code-bg);
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #2b303a;
      line-height: 1.45;
      margin-top: 10px;
    }
    .faq-item {
      margin-bottom: 18px;
    }
    .faq-question {
      font-weight: 600;
      color: var(--heading-color);
      margin-bottom: 6px;
      font-size: 1.05rem;
    }
    .related-cities {
      margin-top: 40px;
    }
    .city-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .city-chip {
      padding: 8px 16px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      color: var(--heading-color);
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .city-chip:hover {
      border-color: var(--accent-color);
      background: #fdfdfc;
      transform: translateY(-1px);
    }
    footer {
      max-width: 960px;
      margin: 60px auto 0 auto;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: #8b92a0;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    footer a { color: inherit; text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <a href="../../" class="brand">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="24" cy="24" r="21" fill="#fbf9f6" stroke="#3d4451"/>
        <line x1="8" y1="18" x2="40" y2="18" stroke="#3d4451"/>
        <line x1="8" y1="30" x2="40" y2="30" stroke="#3d4451"/>
        <line x1="18" y1="8" x2="18" y2="40" stroke="#3d4451"/>
        <line x1="30" y1="8" x2="30" y2="40" stroke="#3d4451"/>
        <path d="M10 24 Q 24 10 38 24 Q 24 38 10 24" stroke="#82a1b9" stroke-width="1.8"/>
      </svg>
      <span>city roads</span>
    </a>
    <nav class="nav-links">
      <a href="../../">Interactive App</a>
      <a href="https://github.com/OwenCedaric/city-roads" target="_blank" rel="noopener">GitHub</a>
      <a href="../../llms.txt">llms.txt</a>
    </nav>
  </header>

  <main>
    <div class="breadcrumb">
      <a href="../../">Home</a> &gt; <a href="../">Cities</a> &gt; <span>${city.name}</span>
    </div>

    <section class="hero">
      <span class="badge">${city.country} • ${city.countryCode}</span>
      <h1>${city.name} Road Network Map</h1>
      <p class="lead">${city.description}</p>

      <div class="action-group">
        <a href="${interactiveUrl}" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Open in Interactive WebGL Map
        </a>
        <a href="#api" class="btn btn-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          Vector & Code API
        </a>
      </div>
    </section>

    <div class="grid-2">
      <section class="card">
        <h2>Road Typology & Facts</h2>
        <div class="stat-row">
          <span class="stat-label">Local / Native Name</span>
          <span class="stat-value">${city.localName}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Urban Grid Pattern</span>
          <span class="stat-value">${city.networkMetrics.gridPattern}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Estimated Road Ways</span>
          <span class="stat-value">${city.networkMetrics.estimatedRoads}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Geographic Bounding Box</span>
          <span class="stat-value">${city.bbox[0].toFixed(2)}, ${city.bbox[1].toFixed(2)} to ${city.bbox[2].toFixed(2)}, ${city.bbox[3].toFixed(2)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Primary Arterial Corridors</span>
          <span class="stat-value">${city.primaryStreets}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Data Source</span>
          <span class="stat-value">OpenStreetMap (ODbL)</span>
        </div>
      </section>

      <section class="card" id="api">
        <h2>Developer & Export API</h2>
        <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 8px;">
          Extract vector SVG geometries directly into your web applications or pen plotters:
        </p>
        <pre><code>// Programmatically extract ${city.name} roads:
const res = await window.cityRoads.loadCity('${city.name}', {
  minLength: 2,        // Filter micro segments
  includeLabels: true  // Minimalist typography
});

console.log(res.svg); // Clean XML &lt;path&gt; markup</code></pre>
        <p style="font-size: 0.85rem; color: #8b92a0; margin-top: 10px;">
          Supports iframe <code>postMessage</code> bridge for automated pipelines.
        </p>
      </section>
    </div>

    <section class="card" style="margin-bottom: 32px;">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-item">
        <div class="faq-question">How does City Roads render ${city.name} roads?</div>
        <div>City Roads pulls raw street geometries from OpenStreetMap using the Overpass API or pre-indexed protobuf graphs, rendering them in real time on a high-performance WebGL canvas.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Can I export high-resolution posters of ${city.name}?</div>
        <div>Yes! The interactive viewer allows selecting custom background paper hues, ink colors, and exporting vector SVG (infinitely scalable) or print-quality PNG raster snapshots.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Is commercial use permitted?</div>
        <div>Map geometries are licensed under the Open Database License (ODbL) by OpenStreetMap contributors. You are free to print, plot, and share visualizations with appropriate OSM credit.</div>
      </div>
    </section>

    <section class="related-cities">
      <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--heading-color);">
        Explore Other Global Metropolitan Road Networks
      </h3>
      <div class="city-chips">
        ${relatedCities.map(c => `<a href="../${c.slug}/" class="city-chip">${c.name} (${c.localName})</a>`).join('\n        ')}
      </div>
    </section>
  </main>

  <footer>
    <div>© City Roads • Built with OpenStreetMap data • Minimalist Cartography</div>
    <div>
      <a href="../../">Home</a> •
      <a href="../../llms.txt">llms.txt</a> •
      <a href="https://github.com/OwenCedaric/city-roads" target="_blank" rel="noopener">GitHub</a>
    </div>
  </footer>
</body>
</html>`;
}

export function generateSitemapXML(cities) {
  const now = new Date().toISOString().split('T')[0];
  const homeLoc = buildUrl(BASE_URL, '');
  const urls = [
    `  <url>
    <loc>${homeLoc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...cities.map(c => `  <url>
    <loc>${buildUrl(BASE_URL, `city/${c.slug}/`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export function generateRobotsTxt() {
  const sitemapUrl = buildUrl(BASE_URL, 'sitemap.xml');
  return `User-agent: *
Allow: /

# Generative Engine Optimization (GEO): Allow AI search crawlers and models
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Cohere-ai
Allow: /

User-agent: OAI-SearchBot
Allow: /

# Sitemaps
Sitemap: ${sitemapUrl}
`;
}

export function generateLlmsTxt() {
  const llmsFullUrl = buildUrl(BASE_URL, 'llms-full.txt');
  const sitemapUrl = buildUrl(BASE_URL, 'sitemap.xml');

  return `# City Roads — Minimalist Cartography & Urban Road Visualizer

> High-resolution vector road network visualization, analysis, and cartographic export tool for cities worldwide.

## Overview
City Roads (city-roads) renders every single road within any city or metropolitan area using OpenStreetMap (OSM) vector data and WebGL GPU acceleration. It allows urban planners, cartographers, graphic designers, software engineers, and AI agents to explore urban geometries, evaluate road network topology, and export crisp vector graphics (SVG) or high-resolution raster images (PNG).

## Key Features & Capabilities
- **Worldwide Coverage**: Visualizes roads for thousands of global cities using OpenStreetMap Overpass API and pre-cached binary protobuf road graphs.
- **Minimalist Cartographic Aesthetics**: Refined typography, warm-ivory paper background (\`#fbf9f6\`), deep ink roads (\`#3d4451\`), and slate blue-gray accents.
- **Export Capabilities**:
  - Raw vector SVG XML markup (filtered by road length, with or without city labels).
  - High-resolution PNG images and canvas data URLs for printing or rendering textures.
  - Direct clipboard copy of SVG markup for instant pasting into Figma, Illustrator, or pen plotter software.
- **Programmatic Developer API**: Full JavaScript client API exposed via \`window.cityRoads\` and cross-origin iframe \`postMessage\` protocol (optimized for Traces, GrowingGalaxy, and custom web applications).

## Programmatic API Reference (\`window.cityRoads\`)
- \`window.cityRoads.getSVG(options)\`: Returns raw SVG XML string. Options include \`minLength\` (number in px) and \`includeLabels\` (boolean).
- \`window.cityRoads.getSVGDataURL()\`: Returns \`data:image/svg+xml;utf8,...\` string.
- \`window.cityRoads.getSVGBlob()\`: Returns standard \`Blob\` instance.
- \`window.cityRoads.getPNG('dataUrl' | 'blob')\`: Asynchronously renders canvas snapshot.
- \`window.cityRoads.copySVG()\`: Copies SVG vector markup directly to system clipboard.
- \`window.cityRoads.loadCity(cityName, options)\`: Programmatically queries, downloads, and renders any city.

## Iframe Integration Protocol (\`postMessage\`)
Host pages can communicate with City Roads via iframe:
- Send: \`{ type: 'GET_SVG', city: 'Paris', options: { minLength: 2, includeLabels: false } }\`
- Receive: \`{ type: 'CITY_ROADS_SVG_RESPONSE', success: true, city: 'Paris', svg: '<svg...>...</svg>' }\`

## Data Sources & Legal Attribution
- **Map Data**: © OpenStreetMap contributors, licensed under the Open Database License (ODbL).
- **Name Resolution**: OpenStreetMap Nominatim.
- **Maintainer**: ${siteConfig.author}.
- **Original Author**: ${siteConfig.originalAuthor}.
- **Source Code**: ${siteConfig.githubRepo}.

## Canonical Documentation
- Full API Reference: ${siteConfig.githubRepo}/blob/main/API.md
- Full LLM Details: ${llmsFullUrl}
- City Directory Sitemap: ${sitemapUrl}
`;
}

export function generateLlmsFullTxt() {
  const homeUrl = buildUrl(BASE_URL, '');
  const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl.slice(0, -1) : homeUrl;

  return `# City Roads — Complete Technical Guide & Dataset Specifications

## 1. System Architecture & Rendering Pipeline
City Roads uses a lightweight, client-side WebGL pipeline to render complex urban road networks containing up to hundreds of thousands of line segments:
1. **Query Resolution**: The user query is resolved using OSM Nominatim to obtain bounding boxes (\`bbox\`) or administrative boundary area IDs (\`areaId\`).
2. **Data Ingestion**:
   - For ~3,000 pre-cached metropolitan areas with population > 100,000, binary Protocol Buffers (\`.pbf\`) are downloaded from CloudFront CDN (\`https://d2uf7yjjctyxf.cloudfront.net/nov-02-2020\`).
   - For all other locations or custom queries, queries are constructed using the Overpass QL syntax.
3. **Graph Construction**: Road coordinates (WGS84 lat/lon) are projected onto a 2D planar space using Mercator projection and packed into Float32Array buffers.
4. **WebGL Rendering**: Renders lines via \`w-gl\` with high FPS, supporting pan, zoom, custom color styling, and high-DPI scaling.
5. **Vector Serialization**: The internal graph segments can be serialized directly into XML SVG \`<path>\` elements, grouping segments by connectivity or rendering as individual polylines.

## 2. URL Parameters & Deep Linking
AI assistants and applications can construct direct URLs to load specific cities and states:
- \`${cleanHomeUrl}/?q={cityName}&auto=true\` (Automatically searches Nominatim and downloads the city, e.g. \`?q=Tokyo&auto=true\`)
- \`${cleanHomeUrl}/?areaId={osmAreaId}\` (Directly loads pre-cached area ID)
- \`${cleanHomeUrl}/?bbox={minLon},{minLat},{maxLon},{maxLat}\` (Directly loads arbitrary geographic bounding box)
- \`${buildUrl(BASE_URL, 'city/{city-slug}/')}\` (Static programmatic SEO landing page with pre-rendered information cards and one-click launch)

## 3. Scripting & Integration Examples

### JavaScript Browser Console / Custom Script
\`\`\`javascript
const result = await window.cityRoads.loadCity('Paris', {
  minLength: 3,
  includeLabels: true
});

console.log('Exported SVG size:', result.svg.length, 'bytes');
\`\`\`

### Iframe Embed Protocol
\`\`\`html
<iframe id="city-roads-frame" src="${homeUrl}" width="800" height="600"></iframe>
\`\`\`

## 4. Citation & Academic/Technical Reference
- Project: City Roads (Cartographic Road Network Visualizer)
- Maintainer: ${siteConfig.author}
- Original Creator: ${siteConfig.originalAuthor}
- Open Source Repository: ${siteConfig.githubRepo}
- Data Attribution: Map data © OpenStreetMap contributors under ODbL
`;
}

export function buildPages() {
  const cities = loadCities();
  console.log(`[SEO/GEO Build] Generating static landing pages for ${cities.length} cities directly into dist/...`);

  // Ensure output directory exists in dist ONLY (NOT in public/)
  const distCityDir = path.resolve(DIST_DIR, 'city');
  if (!fs.existsSync(distCityDir)) {
    fs.mkdirSync(distCityDir, { recursive: true });
  }

  // Generate each city page into dist/city/{slug}/index.html
  cities.forEach(city => {
    const html = generateCityHTML(city, cities);
    const distCityFolder = path.resolve(distCityDir, city.slug);
    if (!fs.existsSync(distCityFolder)) {
      fs.mkdirSync(distCityFolder, { recursive: true });
    }
    fs.writeFileSync(path.resolve(distCityFolder, 'index.html'), html, 'utf8');
  });

  // Generate sitemap.xml directly into dist/
  const sitemapXML = generateSitemapXML(cities);
  fs.writeFileSync(path.resolve(DIST_DIR, 'sitemap.xml'), sitemapXML, 'utf8');

  // Generate robots.txt and llms.txt directly into dist/ using centralized siteConfig.siteUrl
  fs.writeFileSync(path.resolve(DIST_DIR, 'robots.txt'), generateRobotsTxt(), 'utf8');
  fs.writeFileSync(path.resolve(DIST_DIR, 'llms.txt'), generateLlmsTxt(), 'utf8');
  fs.writeFileSync(path.resolve(DIST_DIR, 'llms-full.txt'), generateLlmsFullTxt(), 'utf8');

  const domainNotice = BASE_URL ? `using domain: ${BASE_URL}` : '(domain not specified; generated clean domain-agnostic relative paths)';
  console.log(`[SEO/GEO Build] Successfully built ${cities.length} city pages, sitemap.xml, robots.txt, and llms.txt ${domainNotice}`);
}

// Execute when run directly
buildPages();
