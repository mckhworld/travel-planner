# ADR: Timestamps for Plans, Groups, and Places

## Status
Accepted - Implementation pending

## Context
We need to track when plans, groups, and places are created and modified. This is important for:
- Showing users when content was last updated
- Detecting unsaved changes
- Potential future features like sorting by date, conflict detection, sync

## Decision
Add three distinct timestamps for plans (`created`, `modified`, `lastSaved`) and two timestamps for groups/places (`created`, `modified`).

### Plan Timestamps

| Timestamp | Purpose | When Updated |
|-----------|---------|--------------|
| `created` | When plan was first created | Once, at plan creation |
| `modified` | When plan's content changed (group/place added/updated/deleted) | Only when data fields change |
| `lastSaved` | When plan was last persisted to localStorage | Every save operation |

**Key Difference: `modified` vs `lastSaved`**
- `modified`: Tracks if content changed since last save (e.g., user edits place name → `modified` updates, but if not saved yet, `lastSaved` stays old)
- `lastSaved`: Tracks when data was actually written to localStorage (could be manual save or auto-save)
- This allows detecting unsaved changes: `modified !== lastSaved`

### Group Timestamps

| Timestamp | Purpose | When Updated |
|-----------|---------|--------------|
| `created` | When group was created | Once, at group creation |
| `modified` | When group structure changed (place add/remove/reorder, group rename) | Only structural changes |

### Place Timestamps

| Timestamp | Purpose | When Updated |
|-----------|---------|--------------|
| `created` | When place was created | Once, at place creation |
| `modified` | When ANY field changed (all fields) | Any content change |

## Data Structure

```js
// Plan object:
{
  id: string,         // UUID
  name: string,
  groups: [...],
  _meta: { 
    version: '1.0', 
    created: string,      // ISO timestamp (when plan first created)
    modified: string,     // ISO timestamp (when content last changed)
    lastSaved: string     // ISO timestamp (when last saved to localStorage)
  }
}

// Group object:
{
  id: string,         // UUID
  name: string,
  emoji: string,
  collapsed: boolean,
  places: [...],
  created: string,    // ISO timestamp (when group created)
  modified: string    // ISO timestamp (when structure changed)
}

// Place object:
{
  id: string,         // UUID
  name: string,
  emoji: string,
  lat: number,
  lng: number,
  region: string,
  type: string,
  area: string,
  hours: string,
  notes: string,
  ai_notes: string,
  address: string,
  links: [...],
  created: string,    // ISO timestamp (when place created)
  modified: string    // ISO timestamp (when ANY field changed)
}
```

## Implementation Steps

1. Update `DEFAULT_DATA`: Add UUID `id`, timestamps to plan, groups, places
2. Update `createPlan()`: Generate UUID for plan, set timestamps
3. Update `importPlan()`: Generate UUID for plan if missing, preserve/create timestamps
4. Update group/place creation: Ensure UUID `id` + timestamps
5. Add helper function to update all modified timestamps
6. Update all mutation operations: Update appropriate `modified` timestamps
7. Update export functions: Include all timestamps

## Consequences

- Backward compatible: Existing data without new fields can be handled with defaults
- More accurate tracking of content changes vs save operations
- Enables future features like sorting by date, conflict detection
