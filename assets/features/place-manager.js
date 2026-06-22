import { nextTick } from 'vue'

export function createPlaceManager(selectedPlaceRef, dropdownVisibilityRef, currentPlaceRef) {
    const selectPlace = (gi, pi, groups, markersRef, mapRef, isMobileRef, mobileSidebarOpenRef) => {
        selectedPlaceRef.value = { groupIndex: gi, placeIndex: pi }
        const place = groups[gi].places[pi]
        dropdownVisibilityRef.value[place.id + '_region'] = false
        dropdownVisibilityRef.value[place.id + '_area'] = false
        
        // Close mobile sidebar when selecting a place
        if (isMobileRef.value) {
            mobileSidebarOpenRef.value = false
        }
        
        // Use place ID to find the marker directly
        const marker = markersRef.value[place.id]
        if (marker) {
            mapRef.setView([place.lat, place.lng], mapRef.getZoom(), { animate: false })
            // Delay openPopup to ensure Leaflet popup DOM is ready
            setTimeout(() => { if (markersRef.value[place.id]) markersRef.value[place.id].openPopup() }, 50)
        }
    }
    
    const closeDetail = (selectedPlace, mapPickModeRef, pickMarkerRef) => {
        selectedPlace.value = null
        mapPickModeRef.value = false
        if (pickMarkerRef.value) { 
            mapRef.removeLayer(pickMarkerRef.value)
            pickMarkerRef.value = null
        }
    }
    
    const enableMapPick = (mapRef, mapPickModeRef, pickMarkerRef) => {
        mapPickModeRef.value = !mapPickModeRef.value
        if (mapPickModeRef.value) {
            mapRef.getContainer().style.cursor = 'crosshair'
        } else {
            mapRef.getContainer().style.cursor = ''
            if (pickMarkerRef.value) {
                mapRef.removeLayer(pickMarkerRef.value)
                pickMarkerRef.value = null
            }
        }
    }
    
    const addPlace = (gi, groupsRef, currentPlanIdVal, getAllPlans, updateGroupModified, updatePlanModified) => {
        const now = new Date().toISOString()
        const newPlace = {
            id: crypto.randomUUID(),
            name: '', emoji: '📍',
            lat: 0, lng: 0,
            region: '', type: 'sightseeing',
            area: '', hours: '', notes: '', ai_notes: '', address: '', links: [],
            created: now,
            modified: now
        }
        groupsRef.value[gi].places.push(newPlace)
        
        // Update timestamps
        updateGroupModified(groupsRef.value[gi], now)
        updatePlanModified(now)
        
        nextTick(() => selectPlace(gi, groupsRef.value[gi].places.length - 1))
    }
    
    const deletePlace = (gi, pi, groupsRef, closeDetailFn) => {
        if (!confirm(`確定刪除「${groupsRef.value[gi].places[pi].name}」？`)) return
        groupsRef.value[gi].places.splice(pi, 1)
        closeDetailFn()
        
        // Update timestamps
        const now = new Date().toISOString()
        updateGroupModified(groupsRef.value[gi], now)
        updatePlanModified(now)
    }
    
    const addGroup = (newGroupForm, showAddGroupFormRef, groupsRef, currentPlanIdVal, getAllPlans) => {
        if (!newGroupForm.name.trim()) return
        const now = new Date().toISOString()
        groupsRef.value.push({
            id: crypto.randomUUID(),
            name: newGroupForm.name.trim(),
            emoji: newGroupForm.emoji,
            collapsed: false,
            created: now,
            modified: now,
            places: []
        })
        newGroupForm.name = ''
        newGroupForm.emoji = '📌'
        showAddGroupFormRef.value = false
        
        // Update timestamps
        const currentPlan = getAllPlans()
        if (currentPlan && currentPlan.currentPlanId) {
            const plan = currentPlan.plans[currentPlan.currentPlanId]
            if (plan) {
                plan._meta.modified = now
                localStorage.setItem('travel-map-plans', JSON.stringify(currentPlan))
            }
        }
    }
    
    const deleteGroup = (gi, groupsRef) => {
        if (groupsRef.value.length <= 1) return
        if (!confirm(`確定刪除群組「${groupsRef.value[gi].name}」？其中的地點將移至第一個群組。`)) return
        const now = new Date().toISOString()
        const group = groupsRef.value.splice(gi, 1)[0]
        if (group.places.length > 0) {
            groupsRef.value[0].places.push(...group.places)
        }
        
        // Update timestamps
        const currentPlan = getAllPlans()
        if (currentPlan && currentPlan.currentPlanId) {
            const plan = currentPlan.plans[currentPlan.currentPlanId]
            if (plan) {
                plan._meta.modified = now
                localStorage.setItem('travel-map-plans', JSON.stringify(currentPlan))
            }
        }
    }
    
    const clearFilter = (filterRef) => { 
        filterRef.search = ''; 
        filterRef.type = null 
    }
    
    return {
        selectPlace,
        closeDetail,
        enableMapPick,
        addPlace,
        deletePlace,
        addGroup,
        deleteGroup,
        clearFilter
    }
}
