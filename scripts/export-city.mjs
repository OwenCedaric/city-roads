#!/usr/bin/env node

/**
 * City Roads Vector Poster & Map Exporter
 * Fetches OpenStreetMap road network data (via cache or Overpass API)
 * and generates clean, minimalist SVG posters / vector maps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { geoMercator } from 'd3-geo';
import Pbf from 'pbf';
import { place } from '../src/proto/place.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const THEMES = {
  dark: {
    name: 'dark',
    background: '#0d1117',
    road: 'rgba(240, 246, 252, 0.85)',
    primaryText: '#f0f6fc',
    secondaryText: 'rgba(240, 246, 252, 0.6)',
    accent: '#58a6ff'
  },
  light: {
    name: 'light',
    background: '#fbf9f6',
    road: 'rgba(44, 52, 55, 0.82)',
    primaryText: '#1a202c',
    secondaryText: 'rgba(44, 52, 55, 0.65)',
    accent: '#3182ce'
  },
  blueprint: {
    name: 'blueprint',
    background: '#0b2545',
    road: 'rgba(138, 201, 255, 0.85)',
    primaryText: '#ffffff',
    secondaryText: 'rgba(138, 201, 255, 0.75)',
    accent: '#64b5f6'
  },
  midnight: {
    name: 'midnight',
    background: '#06080e',
    road: 'rgba(255, 215, 0, 0.85)',
    primaryText: '#ffd700',
    secondaryText: 'rgba(255, 248, 220, 0.65)',
    accent: '#ffa000'
  },
  emerald: {
    name: 'emerald',
    background: '#0a1914',
    road: 'rgba(74, 222, 128, 0.85)',
    primaryText: '#86efac',
    secondaryText: 'rgba(200, 250, 215, 0.65)',
    accent: '#4ade80'
  },
  'warm-sand': {
    name: 'warm-sand',
    background: '#f4ece1',
    road: 'rgba(74, 59, 50, 0.85)',
    primaryText: '#382c24',
    secondaryText: 'rgba(74, 59, 50, 0.65)',
    accent: '#8c6d58'
  }
};

const OVERPASS_BACKENDS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/cgi/interpreter'
];

const CDN_CACHE_SERVER = 'https://d2uf7yjjctyxf.cloudfront.net/nov-02-2020';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    city: '',
    theme: 'dark',
    out: '',
    width: 1200,
    height: 1600,
    padding: 80,
    minLength: 1.5,
    strokeWidth: 1.1,
    filter: 'all',
    noLabel: false,
    cacheDir: path.resolve(ROOT_DIR, '.cache/city-roads'),
    json: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--city' || arg === '-c') {
      options.city = args[++i];
    } else if (arg === '--theme' || arg === '-t') {
      options.theme = args[++i] || 'dark';
    } else if (arg === '--out' || arg === '-o') {
      options.out = args[++i];
    } else if (arg === '--width' || arg === '-w') {
      options.width = parseInt(args[++i], 10);
    } else if (arg === '--height' || arg === '-h') {
      options.height = parseInt(args[++i], 10);
    } else if (arg === '--padding') {
      options.padding = parseFloat(args[++i]);
    } else if (arg === '--min-length' || arg === '-m') {
      options.minLength = parseFloat(args[++i]);
    } else if (arg === '--stroke-width' || arg === '-s') {
      options.strokeWidth = parseFloat(args[++i]);
    } else if (arg === '--filter') {
      options.filter = args[++i];
    } else if (arg === '--no-label') {
      options.noLabel = true;
    } else if (arg === '--cache-dir') {
      options.cacheDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
City Roads Vector Poster & Map Exporter

Usage:
  node scripts/export-city.mjs --city "<City Name>" [options]

Options:
  -c, --city <name>        City name to search (e.g. "Seattle", "Kyoto", "Paris", "Hangzhou")
  -t, --theme <theme>      Color theme: dark (default), light, blueprint, midnight, emerald, warm-sand
  -o, --out <path>         Output file path (defaults to ./output/<city>-<theme>.svg)
  -w, --width <pixels>     Canvas width in px (default: 1200)
  -h, --height <pixels>    Canvas height in px (default: 1600)
  -s, --stroke-width <num> Road line stroke width (default: 1.1)
  -m, --min-length <num>   Filter road segments shorter than this length (default: 1.5)
  --filter <type>          Road filter: all (default: way[highway]), major (highways/trunks/primary)
  --no-label               Omit city name and coordinates footer
  --json                   Output machine-readable JSON summary for agents/tools
  --cache-dir <dir>        Cache directory for OSM/PBF data (default: ./.cache/city-roads)
  --verbose, -v            Show verbose debug logs
  --help                   Show this help message
`);
}

async function findBoundary(cityName, cacheDir, verbose) {
  const sanitized = cityName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const cacheFile = path.join(cacheDir, `geo_${sanitized}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (verbose) console.log(`[Cache] Loaded geocoding for "${cityName}" from local cache`);
      return cached;
    } catch {
      // ignore cache read failure
    }
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`;
  if (verbose) console.log(`[Nominatim] Searching for "${cityName}"...`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'city-roads-agent/1.1 (https://github.com/OwenCedaric/city-roads)'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding failed with status ${response.status}`);
  }

  const results = await response.json();
  if (!results || results.length === 0) {
    throw new Error(`No geographic boundary found for city: "${cityName}"`);
  }

  const first = results[0];
  let areaId = null;
  if (first.osm_type === 'relation') {
    areaId = parseInt(first.osm_id, 10) + 36e8;
  } else if (first.osm_type === 'way') {
    areaId = parseInt(first.osm_id, 10) + 24e8;
  }

  let bbox = null;
  if (first.boundingbox) {
    bbox = [
      parseFloat(first.boundingbox[0]), // south
      parseFloat(first.boundingbox[2]), // west
      parseFloat(first.boundingbox[1]), // north
      parseFloat(first.boundingbox[3])  // east
    ];
  }

  const boundary = {
    name: first.display_name,
    shortName: first.name || cityName,
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    osmId: first.osm_id,
    osmType: first.osm_type,
    areaId,
    bbox
  };

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(boundary, null, 2), 'utf8');
  } catch {
    // ignore cache write error
  }

  return boundary;
}

async function fetchRoads(boundary, options) {
  const { areaId, bbox, shortName } = boundary;
  const { cacheDir, filter, verbose } = options;

  fs.mkdirSync(cacheDir, { recursive: true });

  // 1. Try local cache
  const localPbfCache = areaId ? path.join(cacheDir, `${areaId}.pbf`) : null;
  const localJsonCache = path.join(cacheDir, `roads_${areaId || shortName}.json`);

  if (localPbfCache && fs.existsSync(localPbfCache)) {
    if (verbose) console.log(`[Cache] Loading roads from local PBF cache: ${localPbfCache}`);
    const buffer = fs.readFileSync(localPbfCache);
    return parsePbfBuffer(buffer, boundary);
  }

  if (fs.existsSync(localJsonCache)) {
    if (verbose) console.log(`[Cache] Loading roads from local JSON cache: ${localJsonCache}`);
    const raw = JSON.parse(fs.readFileSync(localJsonCache, 'utf8'));
    return parseOsmElements(raw, boundary);
  }

  // 2. Try CloudFront CDN PBF cache if areaId is present
  if (areaId) {
    const cdnUrl = `${CDN_CACHE_SERVER}/${areaId}.pbf`;
    if (verbose) console.log(`[CDN Cache] Checking pre-rendered cache: ${cdnUrl}`);
    try {
      const cdnRes = await fetch(cdnUrl);
      if (cdnRes.ok) {
        const arrayBuf = await cdnRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        try {
          fs.writeFileSync(localPbfCache, buffer);
        } catch {
          // ignore cache write error
        }
        if (verbose) console.log(`[CDN Cache] Successfully downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        return parsePbfBuffer(buffer, boundary);
      }
    } catch (e) {
      if (verbose) console.log(`[CDN Cache] CDN cache miss or error (${e.message}), falling back to Overpass...`);
    }
  }

  // 3. Fallback to Overpass API
  let wayFilter = 'way[highway]';
  if (filter === 'major') {
    wayFilter = 'way[highway~"^(motorway|trunk|primary|secondary|tertiary)"]';
  } else if (filter === 'building') {
    wayFilter = 'way[building]';
  }

  let overpassQuery = '';
  if (areaId) {
    overpassQuery = `[timeout:180][maxsize:1073741824][out:json];
area(${areaId});
(._; )->.area;
(${wayFilter}(area.area); node(w););
out skel;`;
  } else if (bbox) {
    overpassQuery = `[timeout:180][maxsize:1073741824][bbox:${bbox.join(',')}][out:json];
(${wayFilter}; node(w););
out skel;`;
  } else {
    throw new Error('Neither areaId nor bounding box available for Overpass query.');
  }

  let lastError = null;
  for (const server of OVERPASS_BACKENDS) {
    if (verbose) console.log(`[Overpass] Querying backend ${server}...`);
    try {
      const res = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const osmData = await res.json();
      if (!osmData || !osmData.elements) {
        throw new Error('Invalid response payload from Overpass');
      }

      try {
        fs.writeFileSync(localJsonCache, JSON.stringify(osmData.elements), 'utf8');
      } catch {
        // ignore cache write error
      }

      return parseOsmElements(osmData.elements, boundary);
    } catch (err) {
      lastError = err;
      if (verbose) console.warn(`[Overpass] Server ${server} failed: ${err.message}. Trying next backend...`);
    }
  }

  throw new Error(`All Overpass API servers failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

function parsePbfBuffer(buffer, boundary) {
  const pbf = new Pbf(new Uint8Array(buffer));
  const obj = place.read(pbf);

  const nodes = new Map();
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

  for (const node of obj.nodes) {
    nodes.set(node.id, { lon: node.lon, lat: node.lat });
    if (node.lon < minLon) minLon = node.lon;
    if (node.lon > maxLon) maxLon = node.lon;
    if (node.lat < minLat) minLat = node.lat;
    if (node.lat > maxLat) maxLat = node.lat;
  }

  return {
    nodes,
    ways: obj.ways,
    bounds: { minLon, maxLon, minLat, maxLat },
    boundary
  };
}

function parseOsmElements(elements, boundary) {
  const nodes = new Map();
  const ways = [];
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

  for (const el of elements) {
    if (el.type === 'node') {
      nodes.set(el.id, { lon: el.lon, lat: el.lat });
      if (el.lon < minLon) minLon = el.lon;
      if (el.lon > maxLon) maxLon = el.lon;
      if (el.lat < minLat) minLat = el.lat;
      if (el.lat > maxLat) maxLat = el.lat;
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }

  return {
    nodes,
    ways,
    bounds: { minLon, maxLon, minLat, maxLat },
    boundary
  };
}

function renderSvg(gridData, options) {
  const { nodes, ways, bounds, boundary } = gridData;
  const {
    width,
    height,
    padding,
    minLength,
    strokeWidth,
    noLabel
  } = options;

  const theme = THEMES[options.theme] || THEMES.dark;

  // Center coordinates for Mercator projection
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;

  const projection = geoMercator()
    .center([centerLon, centerLat])
    .scale(6371393); // Earth radius scale standard in city-roads

  // Project all ways and find projected bounds
  let minPx = Infinity, maxPx = -Infinity, minPy = Infinity, maxPy = -Infinity;
  const projectedWays = [];

  for (const way of ways) {
    if (!way.nodes || way.nodes.length < 2) continue;
    const wayPoints = [];

    for (const nodeId of way.nodes) {
      const node = nodes.get(nodeId);
      if (!node) continue;
      const xy = projection([node.lon, node.lat]);
      const px = xy[0];
      const py = -xy[1]; // Invert Y axis for screen space

      wayPoints.push({ x: px, y: py });
      if (px < minPx) minPx = px;
      if (px > maxPx) maxPx = px;
      if (py < minPy) minPy = py;
      if (py > maxPy) maxPy = py;
    }

    if (wayPoints.length >= 2) {
      projectedWays.push(wayPoints);
    }
  }

  if (projectedWays.length === 0) {
    throw new Error('No valid road paths could be constructed from data.');
  }

  // Calculate layout space
  const footerHeight = noLabel ? 0 : 160;
  const availWidth = width - padding * 2;
  const availHeight = height - padding * 2 - footerHeight;

  const projWidth = maxPx - minPx;
  const projHeight = maxPy - minPy;

  // Fit into canvas while preserving aspect ratio
  const scale = Math.min(availWidth / projWidth, availHeight / projHeight);
  const mapWidth = projWidth * scale;
  const mapHeight = projHeight * scale;

  const offsetX = padding + (availWidth - mapWidth) / 2;
  const offsetY = padding + (availHeight - mapHeight) / 2;

  // Build SVG path definitions
  let totalSegments = 0;
  let skippedSegments = 0;
  const pathCommands = [];

  for (const way of projectedWays) {
    let isDrawing = false;

    for (let i = 1; i < way.length; i++) {
      const p1 = way[i - 1];
      const p2 = way[i];

      const x1 = ((p1.x - minPx) * scale + offsetX).toFixed(2);
      const y1 = ((p1.y - minPy) * scale + offsetY).toFixed(2);
      const x2 = ((p2.x - minPx) * scale + offsetX).toFixed(2);
      const y2 = ((p2.y - minPy) * scale + offsetY).toFixed(2);

      const segLen = Math.hypot(x2 - x1, y2 - y1);
      if (minLength > 0 && segLen < minLength) {
        skippedSegments++;
        isDrawing = false;
        continue;
      }

      totalSegments++;
      if (!isDrawing) {
        pathCommands.push(`M${x1},${y1}L${x2},${y2}`);
        isDrawing = true;
      } else {
        pathCommands.push(`L${x2},${y2}`);
      }
    }
  }

  // Format typography details
  const cityNamePrimary = (boundary.shortName || options.city || 'CITY').toUpperCase();
  const latFormatted = `${Math.abs(centerLat).toFixed(4)}° ${centerLat >= 0 ? 'N' : 'S'}`;
  const lonFormatted = `${Math.abs(centerLon).toFixed(4)}° ${centerLon >= 0 ? 'E' : 'W'}`;
  const coordsLabel = `${latFormatted}  /  ${lonFormatted}`;

  // Build SVG markup
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      .bg { fill: ${theme.background}; }
      .road-net {
        fill: none;
        stroke: ${theme.road};
        stroke-width: ${strokeWidth};
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .city-title {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 38px;
        font-weight: 700;
        letter-spacing: 0.22em;
        fill: ${theme.primaryText};
        text-anchor: middle;
      }
      .city-coords {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.18em;
        fill: ${theme.secondaryText};
        text-anchor: middle;
      }
      .divider {
        stroke: ${theme.accent};
        stroke-width: 1.5;
        stroke-linecap: round;
        opacity: 0.7;
      }
      .attr {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 10px;
        letter-spacing: 0.15em;
        fill: ${theme.secondaryText};
        opacity: 0.65;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" class="bg" />

  <!-- Road Network -->
  <g id="roads">
    <path class="road-net" d="${pathCommands.join('')}" />
  </g>
`;

  if (!noLabel) {
    const labelCenterY = height - 95;
    svg += `
  <!-- Label & Footer Poster Typography -->
  <g id="labels">
    <text x="${width / 2}" y="${labelCenterY - 32}" class="city-title">${escapeXml(cityNamePrimary)}</text>
    <line x1="${width / 2 - 40}" y1="${labelCenterY - 18}" x2="${width / 2 + 40}" y2="${labelCenterY - 18}" class="divider" />
    <text x="${width / 2}" y="${labelCenterY + 2}" class="city-coords">${coordsLabel}</text>
    <text x="${width / 2}" y="${labelCenterY + 24}" class="attr">ALL ROADS OF ${escapeXml(cityNamePrimary)} • OPENSTREETMAP CONTRIBUTORS</text>
  </g>
`;
  }

  svg += `</svg>\n`;

  return {
    svg,
    stats: {
      totalNodes: nodes.size,
      totalWays: ways.length,
      renderedSegments: totalSegments,
      filteredSegments: skippedSegments,
      centerLat,
      centerLon,
      scale
    }
  };
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

async function main() {
  const options = parseArgs();

  if (!options.city) {
    console.error('Error: City name is required. Use --city "<City Name>" or -c "<City Name>".');
    printHelp();
    process.exit(1);
  }

  const startTime = Date.now();
  if (options.verbose) {
    console.log(`Starting export for: "${options.city}" (Theme: ${options.theme})`);
  }

  // 1. Geocode
  const boundary = await findBoundary(options.city, options.cacheDir, options.verbose);

  // 2. Fetch roads data
  const gridData = await fetchRoads(boundary, options);

  // 3. Render SVG
  const { svg, stats } = renderSvg(gridData, options);

  // 4. Save output
  const outputDir = options.out ? path.dirname(path.resolve(options.out)) : path.resolve(ROOT_DIR, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const safeCityName = boundary.shortName.toLowerCase().replace(/[^a-z0-9_\u4e00-\u9fa5]/gi, '_');
  const defaultFileName = `${safeCityName}-${options.theme}.svg`;
  const outputPath = options.out ? path.resolve(options.out) : path.join(outputDir, defaultFileName);

  fs.writeFileSync(outputPath, svg, 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const fileSizeKb = (Buffer.byteLength(svg, 'utf8') / 1024).toFixed(1);

  if (options.json) {
    console.log(JSON.stringify({
      success: true,
      city: boundary.shortName,
      fullName: boundary.name,
      theme: options.theme,
      outputPath,
      fileSizeKb: parseFloat(fileSizeKb),
      elapsedSeconds: parseFloat(elapsed),
      stats
    }, null, 2));
  } else {
    console.log(`[SUCCESS] Generated city roads vector poster!`);
    console.log(`[City]    ${boundary.shortName} (${boundary.name})`);
    console.log(`[Theme]   ${options.theme} (${options.width}x${options.height}px)`);
    console.log(`[Roads]   ${stats.renderedSegments.toLocaleString()} segments (${stats.totalNodes.toLocaleString()} nodes)`);
    console.log(`[Output]  ${outputPath} (${fileSizeKb} KB)`);
    console.log(`[Elapsed] ${elapsed}s`);
  }
}

main().catch(err => {
  console.error(`[ERROR] Export failed: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
