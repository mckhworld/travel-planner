import { createApp, ref, reactive } from 'vue'
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

// Import helpers
import { getRegionColor, getGroupColor, getRegionName, buildMapsLink, handleFileUpload } from './utils/helpers.js'

// Import features - pass refs as arguments
import { createMapFeature } from './features/map.js'
import { createEmojiPicker } from './features/emoji-picker.js'
import { createDragAndDrop } from './features/drag-and-drop.js'
import { createPlaceManager } from './features/place-manager.js'
import { createPlanUIManager } from './plan-ui/manager.js'

// Initialize feature modules with refs
const { initMap, updateMarkers, setupGroupsWatch } = createMapFeature(
    ref(null), // mapRef
    ref({}), // markersRef
    mapPickMode, // mapPickModeRef
    ref(null) // pickMarkerRef
)

const { openEmojiPicker, closeEmojiPicker, selectEmoji } = createEmojiPicker(
    showEmojiPicker, // showEmojiPickerRef
    emojiPickerTarget // emojiPickerTargetRef
)

const { 
    onDragStartPlace, onDragOverPlace, onDropOnPlace,
    onDragStartGroup, onDragOverGroup, onDropOnGroup
} = createDragAndDrop(
    dragState, // dragStateRef
    groups // groupsRef
)

const { 
    selectPlace, closeDetail, enableMapPick,
    addPlace, deletePlace, addGroup, deleteGroup, clearFilter
} = createPlaceManager(
    selectedPlace, // selectedPlaceRef
    dropdownVisibility, // dropdownVisibilityRef
    currentPlace // currentPlaceRef
)

const { 
    formatDate, doCreatePlan, doLoadPlan, doDeletePlan,
    handlePlanImport, doRenamePlan, cancelRenamePlan,
    handleRenameBlur, startRenamePlan
} = createPlanUIManager(
    showPlanSelector, // showPlanSelectorRef
    showPlanCreateInput, // showPlanCreateInputRef
    newPlanName, // newPlanNameRef
    createPlanError, // createPlanErrorRef
    editingPlanId, // editingPlanIdRef
    editingPlanName // editingPlanNameRef
)

// Create wrapper functions for helpers that need groups
const wrappedBuildMapsLink = (place) => buildMapsLink(place)
const wrappedGetRegionColor = (region) => getRegionColor(region, groups)
const wrappedGetGroupColor = (gi) => getGroupColor(gi, groups)

// Create Vue app
const app = createApp({
    setup() {
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
            buildMapsLink: wrappedBuildMapsLink, getRegionColor: wrappedGetRegionColor, getRegionName, getGroupColor: wrappedGetGroupColor,
            
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
        initMap()
        
        // Initial marker update
        setTimeout(() => { updateMarkers() }, 200)
    }
})
