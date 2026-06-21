# Plan: Multiple Plans Feature

## Overview
Add support for multiple travel plans stored in localStorage, with a plan switcher UI.

## Storage Design
```js
// localStorage key: 'travel-map-plans'
{
  "currentPlanId": "plan_abc123",
  "plans": {
    "plan_abc123": {
      "name": "東京之旅",
      "groups": [...],
      "_meta": { "version": "1.0", "lastSaved": "..." }
    },
    "plan_def456": { ... }
  }
}

// Old single-plan key 'travel-map-data' becomes migration path:
// On first load, if old key exists, migrate it to a new plan.
```

## UI Changes

### 1. Title Bar (top-header)
- Keep existing title "🗾 旅行地圖"
- Show current plan name after title: `🗾 旅行地圖 · 東京之旅`
- Add a **switch icon** (📋) next to plan name that opens the plan selection view

### 2. Plan Selection View (new overlay panel)
A full-height slide-in panel from the right side, containing:

**Header**: "📋 行程管理" + close button (✕)

**Plan List Section**:
- Scrollable list of all plans, each showing:
  - Plan name (editable on hover)
  - Place count badge: `5 地點`
  - Last modified date (relative, e.g. "2小時前")
  - Action buttons: Load / Delete

**Action Buttons**:
- ➕ **新增行程** — Opens a modal/input for plan name, then creates and loads it
- 📤 **匯入行程** — Triggers file import (creates new plan, see below)

### 3. Import Behavior
- Read JSON file, extract `groups` array
- Generate plan name: `{original_filename_without_extension} {YYYYMMDD_HHmmss}` (e.g., `東京之旅_20260620_153045`)
- Validate plan name uniqueness across all plans
- Create new plan with imported data, auto-select it

### 4. Export Behavior (unchanged semantics)
- `downloadJSON` exports **current plan only** as `.json`

### 5. Migration
- On app load, check for old `travel-map-data` key
- If found and no plans exist in new format, migrate to first plan with name "預設行程"
- Delete old key after migration

## Implementation Steps

### Step 1: Storage Layer
- Replace `STORAGE_KEY` with plan management functions:
  - `getAllPlans()` — returns `{ currentPlanId, plans }`
  - `saveCurrentPlan(data)` — saves current plan to plans map + updates timestamp
  - `loadAllPlans()` — loads from localStorage, handles migration
  - `createPlan(name)` — creates new plan entry
  - `loadPlan(planId)` — sets currentPlanId, reloads groups
  - `deletePlan(planId)` — removes plan (min 1 plan required)
  - `importPlan(data, suggestedName)` — creates new plan with imported data

### Step 2: UI Changes
- Add `showPlanSelector` ref (boolean)
- Modify title bar to show plan name and switch button
- Add plan selection panel (slide-in from right, `z-index: 1006`)
- Add plan creation modal/input inline in selector

### Step 3: Wire Up Actions
- Connect switch button → toggle `showPlanSelector`
- Connect create/load/delete to storage functions
- Modify import to use new plan creation flow
- Ensure all existing save/load uses new storage layer

### Step 4: Cleanup
- Remove old `beforeunload` warning (now per-plan, not global)

## CSS Additions
- `.plan-selector-panel` — right-side slide-in panel (width: 340px)
- `.plan-item` — plan list item with name, badge, actions
- `.plan-actions-overlay` — hover-reveal action buttons

## Edge Cases
- **Empty plan list**: Should never happen (min 1 plan)
- **Duplicate plan names on create/import**: Append numeric suffix or timestamp
- **Delete last plan**: Prevent deletion, show alert
- **Corrupt JSON on import**: Show error alert, no plan created
