# Travel Planner: Leaflet → MapLibre GL JS v5 Migration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace Leaflet with MapLibre GL JS v5 as the map rendering engine in the travel planner web app, preserving all existing functionality (emoji markers, popups, map-click coordinate picking, fit-to-markers bounds, mobile layout). Upgrade tile source to vector tiles for best quality and performance.

**Architecture:** MapLibre GL JS v5 (WebGL vector tile engine) + CartoDB Positron vector tiles (free, no API key, beautiful basemap) + custom emoji sprite for marker icons. Marker logic changes from `L.marker` × N instances to a single GeoJSON source + circle/symbol layers with pre-rendered emoji sprites.

**Tech Stack:** MapLibre GL JS v5.x, CartoDB basemap (free tier), Vue 3, Vite, custom emoji sprite sheet.

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MapLibre version | **v5.x** | User confirmed. Latest stable, best performance. |
| Emoji marker rendering | **Custom sprite sheet** (see below) | System emoji fonts render inconsistently across OS/browser. Sprite guarantees pixel-perfect, colored emoji on every device. |
| Tile source | **CartoDB Positron vector tiles** | Free, no API key required, beautiful clean style, vector tiles = faster rendering + smaller bandwidth vs OSM raster. Alternative: MapTiler (better styles but requires API key). |

### Emoji Rendering — Options Analysis

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. Symbol layer `text-field`** | Simple, no extra assets | System emoji font varies by OS (Apple Color Emoji vs Noto vs Windows Segoe). Black-and-white on some devices. Inconsistent sizing. | ❌ Reject |
| **B. Circle layer only** | Consistent, fast | Loses emoji entirely — core UX feature of the app | ❌ Reject |
| **C. `L.marker`-style HTML overlay** | Full emoji support | Defeats the purpose of migrating to WebGL. DOM overlay per marker = poor performance at scale. | ❌ Reject |
| **D. Custom sprite sheet** ✅ | Pixel-perfect emoji on all devices. GPU-accelerated. MapLibre native support. One-time build cost. | Requires generating sprite PNG + JSON at build time. | **Recommended** |
| **E. Per-marker image URL** | No build step | N HTTP requests for N markers. Slow. No batching. | ❌ Reject |

**Sprite sheet approach (Option D):**
- Build script scans all places for unique emoji → renders each to PNG using a canvas + consistent emoji font (e.g., Noto Color Emoji) → assembles into a sprite sheet → generates `sprite.json` with icon coordinates → MapLibre loads it via `map.setSprite()`.
- Fallback: if emoji rendering is problematic, use a pre-built sprite from a library like [emoji-datasource](https://github.com/mervick/emoji-button) or manually curate the ~30 emoji used in the app.

### Tile Source — Options Analysis

| Provider | Type | Cost | API Key | Quality | Speed | Verdict |
|----------|------|------|---------|---------|-------|---------|
| **CartoDB Positron** ✅ | Vector | Free (open) | No | Clean, minimal, excellent readability | Fast (vector, cached) | **Recommended** |
| **CartoDB Dark Matter** | Vector | Free (open) | No | Dark theme, stylish | Fast | Alternative |
| MapTiler Basic | Vector | Free tier (25k loads/day) | Yes | Beautiful, multiple styles | Fast | Good if API key acceptable |
| OSM raster (current) | Raster | Free | No | Standard, cluttered | Slower (larger tiles) | Baseline |
| Google Maps | Vector | Paid ($7/mo min) | Yes + billing | Best quality | Fast | Overkill |
| Mapbox Streets | Vector | Free tier (50k loads/mo) | Yes | Beautiful | Fast | Good alternative |

**CartoDB Positron (Recommended):**
- Completely free, no registration, no API key
- Clean, minimal style — perfect for overlaying travel markers
- Vector tiles = crisp at any zoom, smaller bandwidth
- Style URL: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Dark variant available: `dark-matter-gl-style/style.json`

---

## Current State

| Aspect | Current |
|--------|---------|
| Map lib | Leaflet 1.9.4 (CDN + npm) |
| Tiles | OpenStreetMap raster via `L.tileLayer` |
| Markers | `L.marker` + `L.divIcon` (emoji in HTML div) — one per place |
| Popups | `marker.bindPopup()` — one per marker |
| Click-to-pick | `L.marker` for temp pick marker |
| Fit bounds | `L.featureGroup(markers).getBounds().pad()` |
| Map center | `map.setView([36.2, 139.3], 9)` |
| CSS | Leaflet CSS via CDN in `index.html` |
| Code location | `src/App.vue` lines 464-1311 (script), 1314-1610 (CSS) |
| Deploy | `gh-pages -d dist` |

## Files To Change

| File | Action |
|------|--------|
| `package.json` | Replace `leaflet` → `maplibre-gl` + add sprite gen dep |
| `index.html` | Remove Leaflet CDN, add MapLibre CSS |
| `src/App.vue` | Rewrite all map-related code + CSS |
| `scripts/generate-emoji-sprite.py` (new) | Build-time sprite sheet generator |
| `vite.config.js` | Add sprite generation pre-build step |

---

## Task 1: Add maplibre-gl dependency, remove leaflet

**Objective:** Swap the npm dependency from Leaflet to MapLibre GL JS v5.

**Files:**
- Modify: `package.json`

**Step 1: Edit package.json**

```json
{
  "dependencies": {
    "maplibre-gl": "^5.2.0",
    "vue": "^3.4.38",
    "vue3-google-signin": "^2.1.1"
  }
}
```

Remove `"leaflet": "^1.9.4"`, add `"maplibre-gl": "^5.2.0"`.

**Step 2: Install**

```bash
cd /opt/data/workspace/travel-planner
npm install
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): replace leaflet with maplibre-gl@5"
```

---

## Task 2: Generate emoji sprite sheet

**Objective:** Create a build script that generates a MapLibre-compatible sprite sheet from the emoji used in the app.

**Files:**
- Create: `scripts/generate-emoji-sprite.py`
- Create: `public/sprite.png` (generated)
- Create: `public/sprite.json` (generated)

**Step 1: Create the sprite generator script**

The script:
1. Reads `src/data/constants.js` to find `COMMON_EMOJIS` and all emoji used in `PLACE_TYPES`
2. Renders each emoji to a 32×32 canvas using a consistent font
3. Assembles them into a sprite sheet PNG (2×2 grid or single row)
4. Generates `sprite.json` with icon names, widths, heights, and pixel ratios

MapLibre sprite JSON format:
```json
{
  "emoji-📍": { "height": 32, "pixelRatio": 2, "width": 32, "x": 0, "y": 0, "mask": true },
  "emoji-🏨": { "height": 32, "pixelRatio": 2, "width": 32, "x": 64, "y": 0, "mask": true },
  ...
}
```

**Implementation approach:** Use Python with `Pillow` + a bundled emoji font (Noto Color Emoji .ttc). If Pillow/font setup is complex, fallback to a simpler approach: use JavaScript/Node.js with `canvas` npm package, or manually create a minimal sprite with the ~20 most common travel emoji.

**Simpler fallback approach (recommended for first iteration):**

Instead of a complex build script, create a static sprite manually:
1. Identify the emoji used: from `COMMON_EMOJIS` in `constants.js` + any emoji in place data
2. Use an online tool or a one-time Python script to render them
3. Commit the static `sprite.png` + `sprite.json` to `public/`
4. If new emoji are added later, regenerate

```bash
# Check what emoji are used
grep -o '[\U0001F000-\U0001FFFF]' src/data/constants.js | sort -u
```

**Step 2: Create a minimal sprite generator**

Create `scripts/generate-emoji-sprite.py`:

```python
#!/usr/bin/env python3
"""Generate MapLibre sprite sheet from emoji list."""
import json
import sys
from pathlib import Path

# Emoji to include — read from constants or hardcode common ones
EMOJI_LIST = [
    '📍', '🏨', '🍜', '🏛️', '🛍️', '🚉', '🗼', '⛩️',
    '🏖️', '🎡', '🍣', '☕', '🏥', '⛪', '🌸', '🎭',
    '🏯', '🚂', '🗻', '🌊', '🎪', '🏝️', '🎢', '🍱',
    '🛕', '🏠', '🚗', '✈️', '🚌', '🚕'
]

ICON_SIZE = 32
GRID_COLS = 8  # sprites per row

def generate_sprite_json(emoji_list: list[str], icon_size: int, cols: int) -> dict:
    """Generate sprite.json — assumes sprite.png is already created."""
    sprite = {}
    for i, emoji in enumerate(emoji_list):
        row = i // cols
        col = i % cols
        name = f"emoji-{emoji}"
        sprite[name] = {
            "height": icon_size,
            "pixelRatio": 2,
            "width": icon_size,
            "x": col * icon_size * 2,  # @2x
            "y": row * icon_size * 2,
            "mask": False
        }
    return sprite

if __name__ == '__main__':
    output = Path('public/sprite.json')
    sprite = generate_sprite_json(EMOJI_LIST, ICON_SIZE, GRID_COLS)
    output.write_text(json.dumps(sprite, indent=2, ensure_ascii=False) + '\n')
    print(f"Generated {output} with {len(sprite)} icons")
    print(f"Sprite sheet size: {GRID_COLS * ICON_SIZE * 2}x{(len(EMOJI_LIST)//GRID_COLS + 1) * ICON_SIZE * 2}px (@2x)")
```

**Step 3: Create the sprite PNG**

For the initial iteration, create the sprite PNG using a simple HTML page + screenshot, or use a one-off Node.js script with the `canvas` package:

```bash
# One-time: install canvas temporarily
npm install --no-save canvas
```

Create `scripts/build-sprite.mjs`:

```javascript
import { createCanvas, registerFont } from 'canvas'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const EMOJI = ['📍','🏨','🍜','🏛️','🛍️','🚉','🗼','⛩️','🏖️','🎡','🍣','☕','🏥','⛪','🌸','🎭','🏯','🚂','🗻','🌊','🎪','🏝️','🎢','🍱','🛕','🏠','🚗','✈️','🚌','🚕']
const SIZE = 32
const COLS = 8
const ROWS = Math.ceil(EMOJI.length / COLS)

const canvas = createCanvas(COLS * SIZE * 2, ROWS * SIZE * 2)
const ctx = canvas.getContext('2d')
ctx.scale(2, 2)
ctx.font = `${SIZE - 4}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'

EMOJI.forEach((emoji, i) => {
  const x = (i % COLS) * SIZE + SIZE / 2
  const y = Math.floor(i / COLS) * SIZE + SIZE / 2
  ctx.fillText(emoji, x, y)
})

writeFileSync(resolve('public/sprite.png'), canvas.toBuffer('image/png'))
console.log(`Sprite: ${COLS * SIZE}x${ROWS * SIZE}px (@1x), ${EMOJI.length} icons`)
```

**Step 4: Run sprite generation**

```bash
cd /opt/data/workspace/travel-planner
node scripts/build-sprite.mjs
python3 scripts/generate-emoji-sprite.py
```

Verify `public/sprite.png` and `public/sprite.json` exist.

**Step 5: Commit**

```bash
git add scripts/generate-emoji-sprite.py scripts/build-sprite.mjs public/sprite.png public/sprite.json
git commit -m "feat(map): add emoji sprite sheet for maplibre marker icons"
```

---

## Task 3: Update index.html — replace CDN links

**Objective:** Remove Leaflet CDN CSS/JS, add MapLibre GL JS v5 CSS.

**Files:**
- Modify: `index.html`

**Step 1: Replace CDN links**

Remove:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

Add:
```html
<link href="https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.css" rel="stylesheet" />
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "chore(html): swap leaflet CDN for maplibre-gl@5 CSS"
```

---

## Task 4: Rewrite map initialization — MapLibre + CartoDB style

**Objective:** Replace `initMap()` — Leaflet `L.map` + `L.tileLayer` → MapLibre `new Map()` + CartoDB Positron vector style + emoji sprite.

**Files:**
- Modify: `src/App.vue` (lines ~1184-1220)

**Step 1: Update imports**

At the top of `<script setup>`, add:

```javascript
import MapLibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
```

Remove any Leaflet import if present.

**Step 2: Update map variables (line ~464-466)**

```javascript
let map: MapLibre.Map | null = null
let popup: MapLibre.Popup | null = null
let pickMarker: MapLibre.Marker | null = null
```

**Step 3: Rewrite `initMap()`**

Replace the entire function:

```javascript
const initMap = () => {
  map = new MapLibre.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [139.3, 36.2],  // [lng, lat]
    zoom: 9,
    attributionControl: true
  })

  // Load custom emoji sprite
  map.setSprite('sprite')  // resolves to /sprite.json from Vite public/

  map.addControl(new MapLibre.AttributionControl({ compact: true }))

  map.on('load', () => {
    // Add GeoJSON source for markers
    if (!map.getSource('markers')) {
      map.addSource('markers', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
    }

    // Circle layer (colored dot background)
    map.addLayer({
      id: 'marker-circles',
      type: 'circle',
      source: 'markers',
      paint: {
        'circle-radius': 16,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-blur': 0
      }
    })

    // Icon layer (emoji sprite overlay)
    map.addLayer({
      id: 'marker-icons',
      type: 'symbol',
      source: 'markers',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': 0.6,
        'icon-allow-overlap': false,
        'icon-ignore-placement': true
      }
    })

    // Marker click → select place + show popup
    map.on('click', 'marker-circles', onMarkerClick)
    map.on('click', 'marker-icons', onMarkerClick)

    // Cursor hover
    map.on('mouseenter', 'marker-circles', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'marker-circles', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'marker-icons', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'marker-icons', () => { map.getCanvas().style.cursor = '' })

    updateMarkers()
  })

  // Map click → pick coordinate or close detail
  map.on('click', (e) => {
    // Check if click was on a marker (already handled above)
    const features = map.queryRenderedFeatures(e.point, { layers: ['marker-circles', 'marker-icons'] })
    if (features.length > 0) return  // let marker handler deal with it

    if (mapPickMode.value && currentPlace.value) {
      currentPlace.value.lat = e.lngLat.lat
      currentPlace.value.lng = e.lngLat.lng
      updateMarkers()
      if (pickMarker) pickMarker.remove()
      pickMarker = new MapLibre.Marker({ color: '#667eea', scale: 0.5 })
        .setLngLat(e.lngLat)
        .addTo(map)
      mapPickMode.value = false
    } else {
      closeDetail()
    }
  })
}

// Marker click handler (separate function for clarity)
const onMarkerClick = (e: any) => {
  const props = e.features?.[0]?.properties
  if (!props) return

  const gi = props.groupIndex
  const pi = props.placeIndex

  selectPlace(gi, pi, false)

  // Show popup
  if (popup) popup.remove()
  const place = groups.value[gi]?.places[pi]
  const typeInfo = PLACE_TYPES[place?.type] || PLACE_TYPES['other']
  popup = new MapLibre.Popup({ offset: 25, maxWidth: '280px' })
    .setLngLat(e.lngLat)
    .setHTML(`
      <h3>${props.emoji} ${props.name}</h3>
      <span class="region-badge" style="background-color: ${props.groupColor}">${props.region}</span>
      <span class="type-badge" style="background-color: ${props.color}">${typeInfo.name}</span>
      ${props.hours ? `<p style="margin-top: 6px; font-size: 12px;">🕐 ${props.hours}</p>` : ''}
      <a href="${buildMapsLink(place)}" target="_blank" class="popup-link">📍 Google Maps</a>
    `)
    .addTo(map)
}
```

**Key changes from Leaflet:**
- `center: [lng, lat]` (MapLibre uses lng first)
- CartoDB Positron vector style URL (no manual tile layer needed)
- `map.setSprite('sprite')` loads emoji sprite from `public/sprite.*`
- Two layers: `marker-circles` (colored dots) + `marker-icons` (emoji sprites)
- `queryRenderedFeatures` to distinguish marker clicks from map clicks
- No `invalidateSize()` needed — MapLibre handles resize automatically
- No `fixTileContainer()` hack needed

**Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat(map): replace leaflet init with maplibre-gl v5 + CartoDB Positron + emoji sprite"
```

---

## Task 5: Rewrite updateMarkers() — GeoJSON with sprite icon names

**Objective:** Replace Leaflet marker loop with GeoJSON source update that includes sprite icon references.

**Files:**
- Modify: `src/App.vue` (lines ~1222-1257)

**Step 1: Rewrite `updateMarkers()`**

```javascript
const updateMarkers = () => {
  if (!map) return

  const features: any[] = []

  groups.value.forEach((group, gi) => {
    group.places.forEach((place, pi) => {
      if (!place.lat || !place.lng) return
      const typeInfo = PLACE_TYPES[place.type] || PLACE_TYPES['other']
      const emoji = place.emoji || '📍'
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [place.lng, place.lat]  // [lng, lat]
        },
        properties: {
          id: place.id,
          name: place.name || '未命名',
          emoji: emoji,
          icon: `emoji-${emoji}`,  // sprite key
          color: typeInfo.color,
          region: getRegionName(place.region),
          groupColor: getGroupColor(gi),
          hours: place.hours || '',
          groupIndex: gi,
          placeIndex: pi
        }
      })
    })
  })

  const source = map.getSource('markers')
  if (source) {
    source.setData({ type: 'FeatureCollection', features })
  }

  // Fit bounds when markers exist
  if (features.length > 0) {
    const bounds = new MapLibre.LngLatBounds()
    features.forEach((f: any) => bounds.extend(f.geometry.coordinates))
    map.fitBounds(bounds, { padding: 60, animate: false })
  }
}
```

**Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat(map): rewrite updateMarkers with GeoJSON + sprite icon references"
```

---

## Task 6: Update selectPlace() — remove Leaflet marker refs

**Objective:** Fix `selectPlace()` to work without Leaflet marker objects.

**Files:**
- Modify: `src/App.vue` (lines ~598-623)

**Step 1: Rewrite `selectPlace()`**

```javascript
const selectPlace = (gi: number, pi: number, centerMap: boolean = true) => {
  selectedPlace.value = { groupIndex: gi, placeIndex: pi }
  const place = groups.value[gi].places[pi]
  dropdownVisibility[place.id + '_region'] = false
  dropdownVisibility[place.id + '_area'] = false
  if (isMobile.value) mobileSidebarOpen.value = false
  nextTick(() => {
    const el = document.querySelector(`.place-item[data-place-id="${place.id}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
  if (centerMap && map && place.lat && place.lng) {
    map.jumpTo({ center: [place.lng, place.lat], zoom: map.getZoom() })
  }
}
```

**Changes:**
- Removed `markers[place.id]` reference (no individual marker objects)
- Removed `marker.openPopup()` (popup handled by layer click)
- `map.setView([lat, lng])` → `map.jumpTo({ center: [lng, lat] })`
- Removed mobile `containerPointToLatLng` hack (MapLibre handles this natively)

**Step 2: Commit**

```bash
git add src/App.vue
git commit -m "fix(map): update selectPlace — remove leaflet marker refs, use jumpTo"
```

---

## Task 7: Update closeDetail() and enableMapPick()

**Objective:** Fix cleanup functions for MapLibre popup/marker API.

**Files:**
- Modify: `src/App.vue` (lines ~667-681)

**Step 1: Rewrite `closeDetail()`**

```javascript
const closeDetail = () => {
  selectedPlace.value = null
  mapPickMode.value = false
  if (popup) { popup.remove(); popup = null }
  if (pickMarker) { pickMarker.remove(); pickMarker = null }
}
```

**Step 2: Rewrite `enableMapPick()`**

```javascript
const enableMapPick = () => {
  mapPickMode.value = !mapPickMode.value
  if (mapPickMode.value && map) {
    map.getCanvas().style.cursor = 'crosshair'
  } else {
    if (map) map.getCanvas().style.cursor = ''
    if (pickMarker) { pickMarker.remove(); pickMarker = null }
  }
}
```

**Step 3: Commit**

```bash
git add src/App.vue
git commit -m "fix(map): update closeDetail and enableMapPick for maplibre API"
```

---

## Task 8: Update onMounted / onUnmounted lifecycle

**Objective:** Remove Leaflet-specific startup code, add MapLibre cleanup.

**Files:**
- Modify: `src/App.vue` (lines ~1280-1311)

**Step 1: Clean up `onMounted`**

Remove the `setTimeout` `invalidateSize` calls. MapLibre handles resize automatically.

```javascript
onMounted(() => {
  checkMobile()
  const loaded = loadFromLocalStorage()
  if (loaded && loaded.groups) {
    groups.value = loaded.groups
  } else {
    const defaultData = createDefaultData()
    const planId = createPlanStorage('預設行程', defaultData.groups)
    currentPlanIdVal.value = planId
    groups.value = JSON.parse(JSON.stringify(defaultData.groups))
  }
  if (!currentPlanIdVal.value) {
    const plansData = getAllPlans()
    currentPlanIdVal.value = plansData.currentPlanId
  }
  refreshPlanRefs()
  initialSnapshot = getDirtyState()
  initMap()
  // No invalidateSize needed — MapLibre handles resize automatically
  document.addEventListener('click', () => { hasInteracted = true }, { once: true })
  window.addEventListener('resize', checkMobile)
  window.addEventListener('beforeunload', (e) => {
    if (hasInteracted && getDirtyState() !== initialSnapshot) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
})
```

**Step 2: Update `onUnmounted`**

```javascript
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (map) {
    map.remove()  // Properly destroy MapLibre map instance
    map = null
  }
})
```

**Step 3: Commit**

```bash
git add src/App.vue
git commit -m "fix(map): clean lifecycle — remove invalidateSize, add maplibre map.remove()"
```

---

## Task 9: Update CSS — Leaflet → MapLibre classes

**Objective:** Replace Leaflet-specific CSS selectors with MapLibre equivalents.

**Files:**
- Modify: `src/App.vue` style section (lines ~1404-1409)

**Step 1: Replace CSS rules**

Remove:
```css
#map .leaflet-tile-container { width: 100%; height: 100%; }
.leaflet-popup-content { ... }
.leaflet-popup-content h3 { ... }
.leaflet-popup-content .region-badge, .leaflet-popup-content .type-badge { ... }
.leaflet-popup-content .popup-link { ... }
```

Add:
```css
/* MapLibre canvas */
.maplibregl-canvas { outline: none; }

/* MapLibre popup */
.maplibregl-popup-content {
  padding: 8px !important;
  font-size: 13px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.maplibregl-popup-content h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
}
.maplibregl-popup-content .region-badge,
.maplibregl-popup-content .type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: white;
  margin-right: 4px;
}
.maplibregl-popup-content .popup-link {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 10px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 11px;
}
.maplibregl-popup-tip { border-top-color: white !important; }
.maplibregl-popup-close-button { font-size: 18px; right: 4px; top: 2px; }

/* MapLibre attribution */
.maplibregl-ctrl-attrib a { color: rgba(0,0,0,0.75); }
```

**Step 2: Commit**

```bash
git add src/App.vue
git commit -m "style(map): replace leaflet CSS selectors with maplibregl equivalents"
```

---

## Task 10: Build and verify

**Objective:** Ensure the app builds and runs correctly with MapLibre GL JS v5.

**Step 1: Build**

```bash
cd /opt/data/workspace/travel-planner
npm run build
```

Expected: No errors. Check `dist/` bundle size vs previous (MapLibre is larger than Leaflet but vector tiles are smaller).

**Step 2: Preview**

```bash
npm run preview
```

Open `http://localhost:4173` and verify:

- [ ] Map renders with CartoDB Positron tiles (clean, minimal style)
- [ ] Markers appear as colored circles with emoji icons
- [ ] Clicking a marker opens detail panel + popup
- [ ] Popup shows place name, region badge, type badge, hours, Google Maps link
- [ ] "在地圖上選擇座標" button enables crosshair cursor
- [ ] Clicking map places a blue pick marker, sets coordinates
- [ ] Sidebar place list click centers map on marker
- [ ] Filter by type/search still works (markers update)
- [ ] Add/delete/duplicate place updates markers
- [ ] Mobile layout works (resize to 768px)
- [ ] No console errors
- [ ] Zoom in/out is smooth (WebGL vector tiles)

**Step 3: Deploy (optional)**

```bash
npm run deploy
```

**Step 4: Commit**

```bash
git add -A
git commit -m "ci: verify maplibre migration — build, preview, deploy"
```

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sprite emoji rendering quality | Emoji look blurry or wrong color | Use @2x pixel ratio in sprite. Test on target devices. Fallback: increase circle size, remove emoji icon layer. |
| CartoDB tile loading fails | Map blank | Add fallback to OSM raster style URL. |
| MapLibre v5 breaking changes | API mismatch | Check [MapLibre v5 changelog](https://maplibre.org/maplibre-gl-js/docs/). Use v4.x if v5 unstable. |
| Bundle size increase | Slower initial load | MapLibre ~250KB gzipped vs Leaflet ~160KB. Acceptable for WebGL performance gain. |
| Emoji not in sprite | Missing icon (blank) | Add missing emoji to sprite, regenerate. Log warning in console. |
| `canvas` npm package not available on deploy | Sprite build fails | Generate sprite locally, commit static PNG + JSON to repo. No build-time dependency needed. |

## Rollback Plan

If migration fails:
```bash
git revert --no-commit HEAD~10..HEAD
git checkout HEAD -- package.json
npm install
```

Or keep Leaflet on a `leaflet` branch and merge when ready.
