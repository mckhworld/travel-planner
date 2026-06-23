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

const { initMap, updateMarkers, setupGroupsWatch } = createMapFeature(
    ref(null), // mapRef
    ref({}), // markersRef
    mapPickMode, // mapPickModeRef
    ref(null), // pickMarkerRef
    currentPlace, // currentPlaceRef
    selectPlace // selectPlaceFn
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

// Missing functions from original inline script
const closeDropdowns = () => {
    dropdownVisibility['region'] = false
    dropdownVisibility['type'] = false
    dropdownVisibility['area'] = false
}

const selectRegion = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].region = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex]?.places[placeIndex]?.id
    if (placeId) dropdownVisibility[placeId + '_region'] = false
}

const selectType = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].type = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex]?.places[placeIndex]?.id
    if (placeId) dropdownVisibility[placeId + '_type'] = false
}

const selectArea = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].area = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex]?.places[placeIndex]?.id
    if (placeId) dropdownVisibility[placeId + '_area'] = false
}

const selectFilteredPlace = (filteredGi, filteredPi) => {
    if (!filteredGroups.value[filteredGi]?.places?.[filteredPi]) return
    
    const filteredPlace = filteredGroups.value[filteredGi].places[filteredPi]
    
    // Find real group index for updating selectedPlace
    let realGi = 0
    for (let i = 0; i < groups.value.length; i++) {
        const groupPlaces = groups.value[i].places
        for (let j = 0; j < groupPlaces.length; j++) {
            if (groupPlaces[j].id === filteredPlace.id) {
                realGi = i
                break
            }
        }
    }
    
    // Find place index within the group
    let realPi = 0
    for (let i = 0; i < groups.value[realGi].places.length; i++) {
        if (groups.value[realGi].places[i].id === filteredPlace.id) {
            realPi = i
            break
        }
    }
    
    selectPlace(realGi, realPi)
}

const deleteFilteredPlace = (filteredGi, filteredPi) => {
    if (!filteredGroups.value[filteredGi]?.places?.[filteredPi]) return
    const placeId = filteredGroups.value[filteredGi].places[filteredPi].id
    const realPi = groups.value.findIndex(g => g.places.some(p => p.id === placeId))
    if (realPi >= 0) {
        const placeIndex = groups.value[realPi].places.findIndex(p => p.id === placeId)
        if (placeIndex >= 0) deletePlace(realPi, placeIndex)
    }
}

const updateFieldType = (event) => {
    const p = currentPlace.value
    if (!p) return
    const now = new Date().toISOString()
    p.type = event.target.value
    p.modified = now
}

const updatePlaceLinks = (place, links) => {
    if (!place) return
    const now = new Date().toISOString()
    place.links = links
    place.modified = now
}

// Create Vue app
const app = createApp({
    template: '<div id="app"></div>',
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
        // Save HTML before mounting
        const appContent = document.getElementById('app').innerHTML
        
        // Mount Vue to a dummy element instead of replacing #app
        const dummyEl = document.createElement('div')
        app.mount(dummyEl)
        
        // Restore HTML after mounting
        const restoredApp = document.getElementById('app')
        if (restoredApp) {
            // Clear and restore the original HTML
            restoredApp.innerHTML = appContent
        }
        
        // Initialize map after restoring HTML
        setTimeout(() => {
            initMap()
            // Initial marker update
            setTimeout(() => { updateMarkers(groups, PLACE_TYPES, getGroupColor, getRegionName, buildMapsLink) }, 200)
        }, 100)
    }
})
