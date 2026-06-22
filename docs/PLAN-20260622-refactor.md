# 📋 Refactoring Plan: Split index.html into Feature-Based JS Files

**Date:** 2026-06-22  
**Status:** 🟡 Planning Phase

---

## 🎯 Goal
Refactor the ~2000-line inline JavaScript in `index.html` into separate, feature-based JavaScript files for better code management and maintainability.

---

## 📁 Target Directory Structure

```
travel-planner/
├── index.html                          (entry point, minimal imports)
├── docs/
│   └── PLAN-20260622-refactor.md      (this file)
├── assets/
│   ├── main.js                         (Vue app entry + mount)
│   ├── constants.js                    (PLACE_TYPES, REGION_NAMES, etc.)
│   ├── default-data.js                 (DEFAULT_DATA structure)
│   ├── storage/
│   │   ├── plan-manager.js            (plan CRUD operations)
│   │   └── localStorage-utils.js      (get/set helpers + migration)
│   ├── state/
│   │   └── reactive-state.js         (all ref/reactive state)
│   ├── computed/
│   │   └── filters.js                 (filteredGroups, existingRegions, etc.)
│   ├── features/
│   │   ├── map.js                     (Leaflet map init, markers)
│   │   ├── emoji-picker.js           (emoji picker logic)
│   │   ├── drag-and-drop.js          (drag/drop handlers)
│   │   └── place-manager.js          (addPlace, deletePlace, etc.)
│   ├── plan-ui/
│   │   └── manager.js                (plan selector UI handlers)
│   └── utils/
│       ├── timestamp.js               (update timestamps)
│       ├── maps-link.js               (buildMapsLink)
│       └── mobile.js                  (mobile detection)
```

---

## 📦 File Breakdown

### 1. **`constants.js`** (~30 lines)
- `PLACE_TYPES`, `REGION_NAMES`, `REGION_COLOR_PALETTE`, `COMMON_EMOJIS`
- Pure constants, no dependencies

### 2. **`default-data.js`** (~100 lines)
- `DEFAULT_DATA` object structure
- Can be imported by tests

### 3. **`storage/plan-manager.js`** (~200 lines)
- `getAllPlans()`, `createPlan()`, `deletePlan()`, `importPlan()`
- `loadPlan()`, `downloadPlanData()`
- Plan lifecycle management

### 4. **`storage/localStorage-utils.js`** (~50 lines)
- `saveToLocalStorage()`, `loadFromLocalStorage()`
- Migration logic for old format (oldKey: 'travel-map-data')

### 5. **`state/reactive-state.js`** (~80 lines)
- All `ref()` and `reactive()` declarations
- `groups`, `selectedPlace`, `filter`, `dragState`, etc.

### 6. **`computed/filters.js`** (~100 lines)
- `filteredGroups`, `existingRegions`, `existingAreas`, `existingTypes`
- Computed properties for filtering/sorting

### 7. **`features/map.js`** (~150 lines)
- `initMap()`, `updateMarkers()`
- Map event handlers (click, pick mode)
- Leaflet integration

### 8. **`features/emoji-picker.js`** (~40 lines)
- `openEmojiPicker()`, `closeEmojiPicker()`, `selectEmoji()`

### 9. **`features/drag-and-drop.js`** (~100 lines)
- All drag handlers: `onDragStartPlace`, `onDropOnGroup`, etc.
- Reorder logic for groups and places

### 10. **`features/place-manager.js`** (~120 lines)
- `addPlace()`, `deletePlace()`, `selectPlace()`, `closeDetail()`
- Place CRUD operations

### 11. **`plan-ui/manager.js`** (~150 lines)
- Plan selector UI: `doCreatePlan()`, `doLoadPlan()`, `doDeletePlan()`
- Rename, import/export plan

### 12. **`utils/timestamp.js`** (~40 lines)
- `updateGroupModified()`, `updatePlaceModified()(), `updatePlanModified()`

### 13. **`utils/maps-link.js`** (~20 lines)
- `buildMapsLink()`

### 14. **`utils/mobile.js`** (~30 lines)
- `checkMobile()`, `toggleMobileSidebar()`

### 15. **`assets/main.js`** (~50 lines)
- Vue app entry point
- Imports all modules
- `createApp().mount('#app')`
- Lifecycle hooks (`onMounted`, `onUnmounted`)

---

## 🔄 Import Dependencies (Topological Order)

```
constants.js → default-data.js → storage/utils → storage/plan-manager
                                            ↘ state/reactive-state → computed/filters
                                             ↘ features/* → utils/*
                                              ↘ plan-ui/manager
                                               ↘ main.js (wires everything)
```

---

## ✅ Refactoring Steps

### Phase 1: Setup & Constants (Step 1)
- [ ] Create directory structure
- [ ] Extract `constants.js`
- [ ] Extract `default-data.js`

### Phase 2: Storage Layer (Steps 2-3)
- [ ] Extract `storage/localStorage-utils.js`
- [ ] Extract `storage/plan-manager.js`

### Phase 3: State & Computed (Steps 4-5)
- [ ] Extract `state/reactive-state.js`
- [ ] Extract `computed/filters.js`

### Phase 4: Features (Steps 6-10)
- [ ] Extract `features/map.js`
- [ ] Extract `features/emoji-picker.js`
- [ ] Extract `features/drag-and-drop.js`
- [ ] Extract `features/place-manager.js`
- [ ] Extract `plan-ui/manager.js`

### Phase 5: Utilities (Steps 11-14)
- [ ] Extract `utils/timestamp.js`
- [ ] Extract `utils/maps-link.js`
- [ ] Extract `utils/mobile.js`

### Phase 6: Main Entry Point (Step 15)
- [ ] Create `assets/main.js`
- [ ] Update HTML to use ES module imports
- [ ] Test all functionality

### Phase 7: Cleanup & Testing (Steps 16-17)
- [ ] Remove inline script from HTML
- [ ] Verify all features work correctly

---

## 🚀 Implementation Notes

### Commit Policy
- **Commit each small change** after every file creation/modification
- **Do not push** - keep changes local only
- Commit messages should follow: `refactor(js): extract [feature] to separate file`

### Testing Strategy
- After each phase, test that the app still works:
  - Load page in browser
  - Verify map renders
  - Test adding/deleting places
  - Test plan switching
  - Test emoji picker
  - Test drag-and-drop

### Migration Strategy
1. Create new file with extracted code
2. Update HTML to import the new file (keep old inline code temporarily)
3. Test functionality
4. Remove migrated code from HTML
5. Commit changes

---

## 📌 Current State Analysis

### Inline Code Sections in index.html (lines ~849-1948)

| Section | Lines | Description |
|---------|-------|-------------|
| Constants | ~100 | PLACE_TYPES, REGION_NAMES, COMMON_EMOJIS |
| DEFAULT_DATA | ~120 | Default plan structure with Tokyo spots |
| App setup | ~50 | createApp, reactive state declarations |
| Computed | ~100 | filteredGroups, existingRegions, etc. |
| Multi-plan storage | ~250 | getAllPlans, createPlan, deletePlan, importPlan |
| File I/O | ~80 | downloadJSON, handleFileUpload |
| Filtered index wrappers | ~50 | selectFilteredPlace, deleteFilteredPlace |
| CRUD operations | ~100 | addPlace, deletePlace, addGroup, deleteGroup |
| Plan management | ~150 | doCreatePlan, doLoadPlan, rename, import |
| Emoji picker | ~20 | openEmojiPicker, selectEmoji |
| Drag and drop | ~100 | onDragStartPlace, onDropOnGroup, etc. |
| Timestamp helpers | ~30 | updateGroupModified, updatePlanModified |
| Map handling | ~100 | initMap, updateMarkers |
| Lifecycle | ~50 | onMounted, onUnmounted |

---

## ✨ Expected Outcomes

| Benefit | Description |
|---------|-------------|
| **Maintainability** | Each feature in its own file, easier to find and modify |
| **Testability** | Can unit test individual functions without HTML |
| **Reusability** | Utility functions can be imported elsewhere |
| **Collaboration** | Multiple developers can work on different features without conflicts |
| **Tree Shaking** | Unused features won't be bundled if using a build system |

---

## 🚨 Known Challenges

1. **Circular dependencies** - Need to carefully order imports
2. **State sharing** - Some state is accessed across modules (e.g., `groups` in map.js)
3. **Global variables** - `map`, `markers`, `pickMarker` need to be properly exported
4. **Event handlers** - Some handlers reference Vue refs directly

---

## 🔜 Future Enhancements (Not in Scope)

- Add Vite/Webpack for minification
- Code splitting per feature
- Type annotations with TypeScript
- Unit tests for each module

---

## 📝 Progress Tracking

### Step 0: [x] Create this plan file
- [x] Created PLAN-20260622-refactor.md

### Step 1: [x] Create directory structure
- [x] assets/
- [x] assets/storage/
- [x] assets/state/
- [x] assets/computed/
- [x] assets/features/
- [x] assets/plan-ui/
- [x] assets/utils/

### Step 2: [x] Extract constants.js
- [x] Create assets/constants.js
- [x] Copy PLACE_TYPES, REGION_NAMES, REGION_COLOR_PALETTE, COMMON_EMOJIS
- [x] Update HTML to import constants
- [x] Test: app loads without errors

### Step 3: [x] Extract default-data.js
- [x] Create assets/default-data.js
- [x] Copy DEFAULT_DATA structure
- [x] Update HTML to import defaultData
- [x] Test: default places appear on map

### Step 4: [x] Extract storage/localStorage-utils.js
- [x] Create assets/storage/localStorage-utils.js
- [x] Copy saveToLocalStorage, loadFromLocalStorage
- [x] Include migration logic for old format
- [x] Update HTML to import storage utils
- [x] Test: data persists across reloads

### Step 5: [x] Extract storage/plan-manager.js
- [x] Create assets/storage/plan-manager.js
- [x] Copy getAllPlans, createPlan, deletePlan, importPlan, loadPlan
- [x] Update HTML to import plan manager
- [x] Test: plan creation/deletion works

### Step 6: [x] Extract state/reactive-state.js
- [x] Create assets/state/reactive-state.js
- [x] Copy all ref() and reactive() declarations
- [x] Update HTML to import state
- [x] Test: UI updates correctly

### Step 7: [x] Extract computed/filters.js
- [x] Create assets/computed/filters.js
- [x] Copy filteredGroups, existingRegions, etc.
- [x] Update HTML to import computed
- [x] Test: filtering works correctly

### Step 8: [ ] Extract features/map.js
- [ ] Create assets/features/map.js
- [ ] Copy initMap, updateMarkers, map event handlers
- [ ] Update HTML to import map feature
- [ ] Test: map renders and markers work

### Step 9: [ ] Extract features/emoji-picker.js
- [ ] Create assets/features/emoji-picker.js
- [ ] Copy emoji picker handlers
- [ ] Update HTML to import emoji picker
- [ ] Test: emoji picker opens and selects

### Step 10: [ ] Extract features/drag-and-drop.js
- [ ] Create assets/features/drag-and-drop.js
- [ ] Copy all drag handlers
- [ ] Update HTML to import drag and drop
- [ ] Test: reordering works

### Step 11: [ ] Extract features/place-manager.js
- [ ] Create assets/features/place-manager.js
- [ ] Copy addPlace, deletePlace, selectPlace, closeDetail
- [ ] Update HTML to import place manager
- [ ] Test: place CRUD operations work

### Step 12: [ ] Extract plan-ui/manager.js
- [ ] Create assets/plan-ui/manager.js
- [ ] Copy plan selector UI handlers
- [ ] Update HTML to import plan manager
- [ ] Test: plan switching works

### Step 13: [ ] Extract utils/timestamp.js
- [ ] Create assets/utils/timestamp.js
- [ ] Copy timestamp helpers
- [ ] Update HTML to import utils
- [ ] Test: timestamps update correctly

### Step 14: [ ] Extract utils/maps-link.js
- [ ] Create assets/utils/maps-link.js
- [ ] Copy buildMapsLink
- [ ] Update HTML to import utils
- [ ] Test: Google Maps links work

### Step 15: [ ] Extract utils/mobile.js
- [ ] Create assets/utils/mobile.js
- [ ] Copy mobile detection helpers
- [ ] Update HTML to import utils
- [ ] Test: mobile view works

### Step 16: [ ] Create assets/main.js
- [ ] Create main entry point
- [ ] Import all modules in correct order
- [ ] Initialize Vue app and mount
- [ ] Add lifecycle hooks

### Step 17: [ ] Update index.html
- [ ] Remove inline script tag
- [ ] Add ES module imports
- [ ] Test: all functionality works

### Step 18: [ ] Final Testing
- [ ] Test page loads without errors
- [ ] Test map renders correctly
- [ ] Test adding/deleting places
- [ ] Test plan switching
- [ ] Test emoji picker
- [ ] Test drag-and-drop reordering
- [ ] Test mobile view

---

## 📌 Commit Policy Reminder

- **Commit each small change** after every file creation/modification
- **Do not push** - keep changes local only
- Commit messages should follow: `refactor(js): extract [feature] to separate file`

---

*Last updated: 2026-06-22 (Steps 1-7 complete)*
