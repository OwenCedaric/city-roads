# City Roads Themes and Filter Reference

## Supported Themes

Theme Name | Background | Road Color | Text Primary | Accent / Rule | Description
:--- | :--- | :--- | :--- | :--- | :---
`dark` *(default)* | `#0d1117` | `rgba(240, 246, 252, 0.85)` | `#f0f6fc` | `#58a6ff` | Modern GitHub-inspired dark poster. Minimalist and high contrast.
`light` | `#fbf9f6` | `rgba(44, 52, 55, 0.82)` | `#1a202c` | `#3182ce` | Clean gallery print look. Off-white textured canvas with dark ink lines.
`blueprint` | `#0b2545` | `rgba(138, 201, 255, 0.85)` | `#ffffff` | `#64b5f6` | Architectural blueprint styling. Deep navy base with luminous cyan strokes.
`midnight` | `#06080e` | `rgba(255, 215, 0, 0.85)` | `#ffd700` | `#ffa000` | Golden roads on deep abyss. Luxurious and striking.
`emerald` | `#0a1914` | `rgba(74, 222, 128, 0.85)` | `#86efac` | `#4ade80` | Forest & night-vision matrix aesthetic. Deep dark green with neon emerald lines.
`warm-sand` | `#f4ece1` | `rgba(74, 59, 50, 0.85)` | `#382c24` | `#8c6d58` | Vintage paper & espresso ink. Organic, warm, and vintage cartographic tone.

---

## Road Filters

Filter Name | Overpass Filter | Description
:--- | :--- | :---
`all` *(default)* | `way[highway]` | All public roads, streets, alleys, and avenues.
`major` | `way[highway~"^(motorway|trunk|primary|secondary|tertiary)"]` | Major expressways, arterials, and highways only. Reduces file size for huge metropolitan areas.
`building` | `way[building]` | All building footprints instead of roads.

---

## Typography & Poster Dimensions

- **Standard Poster**: 1200 x 1600 px (3:4 aspect ratio, ideal for wall prints & framed art).
- **Square**: 1200 x 1200 px (1:1, ideal for avatars, album art, social embeds).
- **Mobile Wallpaper**: 1080 x 1920 px (9:16 aspect ratio).
- **Desktop Wallpaper**: 1920 x 1080 px or 2560 x 1440 px (16:9 aspect ratio).
