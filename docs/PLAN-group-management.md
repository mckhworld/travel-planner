# Group Management Panel - Implementation Plan

## BDD Test Cases

### Scenario: Open group editor panel from sidebar edit button
- Given I am viewing a plan with multiple groups
- When I click the "Edit" button next to a group name in the sidebar
- Then the group editor panel slides in from the right
- And the panel shows all groups in current order
- And the panel is titled "群組管理"

### Scenario: Reorder groups using drag handles
- Given the group editor panel is open
- When I drag a group's drag handle (☰) to a new position and drop
- Then the group moves to the new position
- And the sidebar group order updates to match (same state)

### Scenario: Rename a group
- Given the group editor panel is open
- When I click the edit icon on a group name
- Then an inline input field appears with the current name
- When I type a new name and press Enter
- Then the group name updates in the panel and sidebar (same state)

### Scenario: Delete a non-first group
- Given the group editor panel is open with 3 groups
- When I click the delete button on the 2nd group
- Then a confirmation dialog appears
- When I confirm
- Then the 2nd group is removed
- And the 2nd group's places move to the 1st group (previous)

### Scenario: Delete the first group
- Given the group editor panel is open with 3 groups
- When I click the delete button on the 1st group
- Then a confirmation dialog appears
- When I confirm
- Then the 1st group is removed
- And the 1st group's places move to the 2nd group (next)

### Scenario: Delete the only group should be prevented
- Given the group editor panel is open with 1 group
- Then the delete button on the group is not visible or disabled

### Scenario: Add a new group from editor
- Given the group editor panel is open
- When I enter a name and click the "新增群組" button
- Then a new group is added to the end of the list
- And the group appears in the sidebar (same state)

### Scenario: Change group emoji from editor
- Given the group editor panel is open
- When I click the emoji picker button on a group
- And I select a new emoji
- Then the group's emoji updates in the panel and sidebar (same state)

### Scenario: Close group editor panel
- Given the group editor panel is open
- When I click the close button or the overlay
- Then the panel slides out and closes

## Implementation Details

### Constraints
- Group editor panel and sidebar share same `groups` state — changes in either reflect immediately
- Delete disabled when only 1 group exists
- Deleted group's places move to: previous group (if exists), else next group (if exists)
- The sidebar's "+ 新增群組" button redirects to the group editor panel
- The "新增群組" section in the editor panel includes emoji selection

### 1. State variables (~line 255)
```js
const showGroupEditor = ref(false)
const editingGroupId = ref(null)
const editingGroupName = ref('')
```

### 2. Sidebar UI (~line 35-38)
- Remove `delete-group-btn` (line 38)
- Add `edit-group-btn` (✏️) next to group name, triggers `openGroupEditor()`

### 3. Sidebar "+ 新增群組" button (~line 71)
- Change `@click="showAddGroupForm = true"` to `@click="openGroupEditor()"` — redirects to group editor panel

### 4. Group editor panel (~line 233)
Slide-in panel reusing `groups.value` directly:
- Header: "群組管理" + close button
- Group list items (using `v-for="(group, gi) in groups"`):
  - Drag handle (☰) with drag-and-drop
  - Emoji display + emoji picker button
  - Group name (inline editable when clicked)
  - Delete button (hidden when only 1 group)
  - Up/Down arrows for reorder
- "新增群組" section at bottom with:
  - Name input
  - Emoji picker button
  - Confirm/Cancel buttons

### 5. Functions (~line 556)
- `openGroupEditor()` / `closeGroupEditor()`
- `startRenameGroup(gi)` / `doRenameGroup(gi)` / `cancelRenameGroup()`
- `moveGroupUp(gi)` / `moveGroupDown(gi)`
- `deleteGroupFromEditor(gi)` — places move to previous group, or next group if first
- Drag-and-drop handlers for group reordering

### 6. CSS (~line 1008)
- `.group-editor-overlay` / `.group-editor-panel`
- `.group-editor-item` with drag handle, action buttons
- Reorder button styles
