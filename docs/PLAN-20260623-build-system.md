# 🛠️ Build System Plan for Travel Planner

**Date:** 2026-06-23  
**Status:** 🟡 Planning Phase

---

## 🎯 Goal

Implement a modern build system to:
1. Bundle all JavaScript modules into a single file
2. Minify and optimize for production
3. Enable ES module imports in the browser
4. Support development with hot reloading (optional)

---

## 📊 Current State

| Component | Status |
|-----------|--------|
| JavaScript Files | 14 separate files in `assets/` |
| HTML Entry Point | `index.html` with inline script (~2000 lines) |
| Dependencies | Vue 3 (via CDN), Leaflet (via CDN) |
| Build Tool | None yet |

### Current File Structure
```
travel-planner/
├── index.html                    (entry point, ~2000 lines inline JS)
├── import-file-schema.json
├── assets/
│   ├── main.js                   (NOT YET CREATED)
│   ├── constants.js
│   ├── default-data.js
│   ├── storage/
│   │   ├── localStorage-utils.js
│   │   └── plan-manager.js
│   ├── state/
│   │   └── reactive-state.js
│   ├── computed/
│   │   └── filters.js
│   ├── features/
│   │   ├── map.js
│   │   ├── emoji-picker.js
│   │   ├── drag-and-drop.js
│   │   └── place-manager.js
│   ├── plan-ui/
│   │   └── manager.js
│   └── utils/
│       ├── timestamp.js
│       ├── maps-link.js
│       └── mobile.js
└── docs/
    └── PLAN-20260623-build-system.md  (this file)
```

---

## 🏗️ Proposed Build System Architecture

### Option A: Vite (RECOMMENDED)

**Pros:**
- Fast development server with HMR
- Built-in Vue 3 support
- Zero config needed for simple projects
- Excellent DX with ES modules
- Production build optimization

**Cons:**
- Requires Node.js environment
- Slightly larger learning curve for config customization

### Option B: Webpack (ALTERNATIVE)

**Pros:**
- Highly configurable
- Large ecosystem of loaders/plugins
- Mature and stable

**Cons:**
- Steeper learning curve
- Slower development server
- Verbose configuration

### Option C: Snowpack (ALTERNATIVE)

**Pros:**
- Fast development with ES modules
- No bundling during dev

**Cons:**
- Less active development recently
- Smaller ecosystem than Vite/Webpack

---

## 📋 Recommended Approach: Vite + ES Modules

### Directory Structure
```
travel-planner/
├── index.html                    (entry point, minimal)
├── package.json                  (NEW - dependencies + scripts)
├── vite.config.js                (NEW - build configuration)
├── import-file-schema.json
└── assets/
    ├── main.js                   (NEW - app entry point)
    ├── constants.js
    ├── default-data.js
    ├── storage/
    │   ├── localStorage-utils.js
    │   └── plan-manager.js
    ├── state/
    │   └── reactive-state.js
    ├── computed/
    │   └── filters.js
    ├── features/
    │   ├── map.js
    │   ├── emoji-picker.js
    │   ├── drag-and-drop.js
    │   └── place-manager.js
    ├── plan-ui/
    │   └── manager.js
    └── utils/
        ├── timestamp.js
        ├── maps-link.js
        └── mobile.js
```

---

## 📄 File Changes Required

### 1. Create `package.json`
```json
{
  "name": "travel-planner",
  "version": "1.0.0",
  "description": "Travel map application with multi-plan support",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-vue": "^5.x"
  },
  "dependencies": {
    "vue": "^3.4",
    "leaflet": "^1.9"
  }
}
```

### 2. Create `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
```

### 3. Update `index.html`
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅行地圖</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <!-- Vue 3 and Leaflet via CDN for simplicity -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script type="importmap">
        {
            "imports": {
                "vue": "https://unpkg.com/vue@3/dist/vue.esm.browser.prod.js"
            }
        }
    </script>
    <!-- Styles (can be extracted to CSS file later) -->
    <style>
        /* All existing styles remain here */
    </style>
</head>
<body>
    <!-- HTML structure remains unchanged -->
    
    <!-- Entry point for modular JavaScript -->
    <script type="module" src="/assets/main.js"></script>
</body>
</html>
```

### 4. Create `assets/main.js`
```javascript
import { createApp } from 'vue'
import { DEFAULT_DATA } from './default-data.js'
import { PLACE_TYPES, REGION_NAMES, COMMON_EMOJIS } from './constants.js'

// Import state
import { createReactiveState } from './state/reactive-state.js'
const { 
    groups, selectedPlace, dropdownVisibility, currentPlace, coordsInput,
    filter, showEmojiPicker, emojiPickerTarget, showAddGroupForm, newGroupForm,
    dragState, isMobile, mobileSidebarOpen, showPlanSelector, showPlanCreateInput,
    newPlanName, createPlanError, importFileInput, editingPlanId, editingPlanName,
    currentPlanIdVal, allPlansObjRef, allPlansListRef, currentPlanNameRef,
    mapPickMode, checkMobile, toggleMobileSidebar
} = createReactiveState(DEFAULT_DATA)

// Import computed properties
import { createComputedProperties } from './computed/filters.js'
const {
    refreshPlanRefs, totalPlaces, totalTypes, existingRegions,
    existingAreas, existingTypes, filterRegions, filterTypes, filteredGroups
} = createComputedProperties(groups, filter, PLACE_TYPES)

// Import storage utilities
import { getAllPlans, saveToLocalStorage, loadFromLocalStorage } from './storage/localStorage-utils.js'
import { createPlan, deletePlan, importPlan, loadPlan, downloadPlanData } from './storage/plan-manager.js'

// Import features
import { createMapFeature } from './features/map.js'
import { createEmojiPicker } from './features/emoji-picker.js'
import { createDragAndDrop } from './features/drag-and-drop.js'
import { createPlaceManager } from './features/place-manager.js'
import { createPlanUIManager } from './plan-ui/manager.js'

// Import utilities
import { buildMapsLink } from './utils/maps-link.js'
import { checkMobile, toggleMobileSidebar } from './utils/mobile.js'

// Create Vue app
const app = createApp({
    setup() {
        // Initialize map feature
        const { initMap, updateMarkers, setupGroupsWatch } = createMapFeature()
        
        // Initialize emoji picker
        const { openEmojiPicker, closeEmojiPicker, selectEmoji } = createEmojiPicker()
        
        // Initialize drag and drop
        const { 
            onDragStartPlace, onDragOverPlace, onDropOnPlace,
            onDragStartGroup, onDragOverGroup, onDropOnGroup
        } = createDragAndDrop()
        
        // Initialize place manager
        const { 
            selectPlace, closeDetail, enableMapPick,
            addPlace, deletePlace, addGroup, deleteGroup, clearFilter
        } = createPlaceManager()
        
        // Initialize plan UI manager
        const { 
            formatDate, doCreatePlan, doLoadPlan, doDeletePlan,
            handlePlanImport, doRenamePlan, cancelRenamePlan,
            handleRenameBlur, startRenamePlan
        } = createPlanUIManager()
        
        // Expose to template
        return {
            groups, selectedPlace, currentPlace, coordsInput, filter,
            showEmojiPicker, emojiPickerTarget, showAddGroupForm, newGroupForm,
            dragState, isMobile, mobileSidebarOpen, showPlanSelector,
            showPlanCreateInput, newPlanName, createPlanError, importFileInput,
            editingPlanId, editingPlanName, currentPlanIdVal, allPlansListRef,
            allPlansObjRef, currentPlanNameRef, totalPlaces, totalTypes,
            existingRegions, existingAreas, existingTypes, filterTypes,
            PLACE_TYPES, REGION_NAMES, COMMON_EMOJIS, dropdownVisibility,
            
            // Methods
            saveToLocalStorage, loadFromLocalStorage,
            downloadPlanData, handleFileUpload,
            selectPlace, closeDetail, closeDropdowns, selectRegion, selectType, 
            selectArea, enableMapPick, filteredGroups, selectFilteredPlace, 
            deleteFilteredPlace, addPlace, deletePlace, addGroup, deleteGroup,
            clearFilter, openEmojiPicker, selectEmoji, closeEmojiPicker,
            onDragStartPlace, onDragOverPlace, onDropOnPlace,
            onDragStartGroup, onDragOverGroup, onDropOnGroup,
            buildMapsLink, getRegionColor, getRegionName, getGroupColor,
            
            // Plan management
            showPlanSelector, showPlanCreateInput, newPlanName, createPlanError,
            importFileInput, editingPlanId, editingPlanName,
            currentPlanNameRef, allPlansListRef, allPlansObjRef,
            refreshPlanRefs, doCreatePlan, doLoadPlan, doDeletePlan, 
            handlePlanImport, formatDate, doRenamePlan, cancelRenamePlan,
            handleRenameBlur, startRenamePlan
        }
    }
})

// Mount app after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('map')
    if (mapEl) {
        app.mount('#app')
        
        // Initialize map
        const { initMap, updateMarkers } = createMapFeature()
        initMap()
        
        // Initial marker update
        setTimeout(() => { updateMarkers() }, 200)
    }
})
```

---

## 🚀 Build Commands

### Development
```bash
npm run dev
# Opens http://localhost:5173 with HMR
```

### Production Build
```bash
npm run build
# Creates dist/ directory with optimized bundle
```

### Preview Production Build
```bash
npm run preview
# Serves the production build locally
```

---

## 📦 Output Structure (after build)

```
dist/
├── index.html                    (optimized, minified)
├── assets/
│   └── main.js                   (bundled and minified)
└── assets/
    ├── index-CSS_HASH.css        (extracted CSS if needed)
    └── main-JS_HASH.js           (bundled JS with hash for cache busting)
```

---

## 🔧 Configuration Details

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  // Development server config
  server: {
    port: 5173,
    open: true,
    proxy: {}
  },
  
  // Build config
  build: {
    outDir: 'dist',
    sourcemap: true,           // Enable source maps for debugging
    minify: 'terser',          // Minify with Terser
    terserOptions: {
      compress: {
        drop_console: true     // Remove console.log statements
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {}       // Optional: custom chunking
      }
    }
  },
  
  // Resolve config
  resolve: {
    alias: {}
  }
})
```

---

## 📊 Benefits

| Benefit | Description |
|---------|-------------|
| **Faster Development** | Vite's native ES modules are faster than bundlers |
| **Better Caching** | Hashed filenames for cache busting |
| **Tree Shaking** | Unused code automatically removed |
| **Code Splitting** | Lazy loading for large apps (future) |
| **Source Maps** | Easier debugging in production |
| **Minification** | Smaller bundle size for production |

---

## 🚨 Migration Steps

### Phase 1: Setup (Step 1)
- [ ] Create `package.json` with dependencies
- [ ] Install dependencies (`npm install`)
- [ ] Create `vite.config.js`
- [ ] Test dev server works

### Phase 2: Update HTML (Step 2)
- [ ] Update `index.html` to use ES module import
- [ ] Remove inline script tag
- [ ] Test basic functionality

### Phase 3: Create main.js (Step 3)
- [ ] Create `assets/main.js` entry point
- [ ] Wire all modules together
- [ ] Test app loads correctly

### Phase 4: Fix Imports (Step 4)
- [ ] Update all module imports
- [ ] Fix circular dependencies if any
- [ ] Test all features work

### Phase 5: Build & Test (Step 5)
- [ ] Run `npm run build`
- [ ] Test production build
- [ ] Verify all features work

### Phase 6: Optimize (Step 6)
- [ ] Add source maps
- [ ] Configure minification
- [ ] Test bundle size

---

## 🎯 Success Criteria

- [ ] `npm run dev` starts development server
- [ ] App works in development mode with HMR
- [ ] `npm run build` creates optimized bundle
- [ ] All features work in production build:
  - [ ] Map renders correctly
  - [ ] Adding/deleting places works
  - [ ] Plan switching works
  - [ ] Emoji picker works
  - [ ] Drag-and-drop reordering works
  - [ ] Mobile view works
- [ ] Bundle size is reasonable (< 100KB gzipped)

---

## 📝 Notes

### Current Dependencies
- Vue 3 (via CDN)
- Leaflet 1.9 (via CDN)

### Future Enhancements
- Migrate to CSS modules or Tailwind CSS
- Add TypeScript for type safety
- Implement code splitting for large features
- Add service worker for offline support

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

*Last updated: 2026-06-23*
