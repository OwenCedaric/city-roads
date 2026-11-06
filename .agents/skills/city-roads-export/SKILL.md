---
name: city-roads-export
description: >-
  Generate clean, minimalist vector road network maps and posters (SVG) for any city in the world using OpenStreetMap data. Use when the user asks to generate, export, or visualize city roads, road grids, urban cartography, or minimalist city art posters for a specific city.
---

# City Roads Vector Poster Exporter

This skill utilizes the `city-roads` cartography engine to automatically fetch OpenStreetMap road networks and render print-ready vector maps and posters in SVG format.

## When to Use

Trigger this skill whenever the user asks:
- "生成某个城市的道路图/路线图/路网海报" (e.g. "帮我生成一张杭州的道路图")
- "导出某城市的极简矢量地图" (e.g. "Export Tokyo road grid as SVG")
- "制作城市壁纸/海报" (e.g. "做一个巴黎暗黑风格的手机壁纸")
- "下载或渲染某区域的街道布局"

---

## Workflow Steps

### Step 1: Clarify Parameters from User Prompt

Extract the following arguments from the user's natural language request:

1. **`city` (Required)**:
   - City name in English, Pinyin, or localized name (e.g. `"Kyoto"`, `"Hangzhou"`, `"Seattle"`, `"Paris"`).
2. **`theme` (Optional, defaults to `"dark"`)**:
   - `dark`: Modern high-contrast dark theme (slate black background, off-white road lines).
   - `light`: Gallery print aesthetic (cream background, dark slate ink).
   - `blueprint`: Architectural blueprint (deep navy, cyan luminous lines).
   - `midnight`: Luxury void (pure black, metallic gold lines).
   - `emerald`: Cyberpunk / radar green (deep forest green, neon emerald lines).
   - `warm-sand`: Vintage warm paper (sandstone background, espresso brown lines).
   - See [themes-and-options.md](./references/themes-and-options.md) for detailed color specifications.
3. **`dimensions` (Optional)**:
   - Poster (default): `--width 1200 --height 1600`
   - Mobile wallpaper: `--width 1080 --height 1920`
   - Desktop wallpaper: `--width 1920 --height 1080`
   - Square: `--width 1200 --height 1200`
4. **`filter` (Optional, defaults to `"all"`)**:
   - Use `--filter major` for massive metropolitan regions or when the user only wants highways and main arterials.
5. **`no-label` (Optional)**:
   - Pass `--no-label` if the user wants pure roads without typography or footer text.

---

### Step 2: Execute the Exporter CLI

Run the Node.js export script using the `run_command` tool (requires network access to fetch OSM boundaries):

```bash
node --no-warnings scripts/export-city.mjs \
  --city "<City Name>" \
  --theme "<theme>" \
  --out "./output/<city>-<theme>.svg" \
  --json
```

*(Note: Add `--verbose` if troubleshooting is needed).*

---

### Step 3: Present the Output to the User

Upon successful execution, the script returns a JSON summary containing:
- Output file path
- Rendered road segment count and node count
- Geographic coordinates (Latitude / Longitude)
- File size (KB)

In your response:
1. Provide a direct markdown link to the generated SVG file (`[filename.svg](file:///path/to/output/filename.svg)`).
2. Summarize the cartographic metadata (total roads rendered, coordinates, style theme applied).
3. Inform the user how they can import the vector file into Figma, Illustrator, or use it for laser cutting and pen plotting.
