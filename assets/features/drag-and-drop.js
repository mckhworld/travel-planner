export function createDragAndDrop(dragStateRef, groupsRef) {
    const onDragStartPlace = (gi, pi, e) => {
        dragStateRef.value.draggingPlace = { groupIndex: gi, placeIndex: pi }
        dragStateRef.value.draggingGroup = null
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '')
    }
    
    const onDragOverPlace = (gi, pi, e) => {
        dragStateRef.value.overGroup = gi
        dragStateRef.value.overPlaceIndex = pi
    }
    
    const onDragOverGroupEnd = (gi, e) => {
        // Dragging over the placeholder at end of group
        dragStateRef.value.overGroup = gi
        dragStateRef.value.overPlaceIndex = null
    }
    
    const onDropOnPlace = (gi, pi, e, updateGroupModified, updatePlanModified) => {
        e.preventDefault()
        if (!dragStateRef.value.draggingPlace) return
        const { groupIndex: fromGi, placeIndex: fromPi } = dragStateRef.value.draggingPlace
        const now = new Date().toISOString()
        
        if (fromGi === gi) {
            // Reorder within same group
            const place = groupsRef.value[fromGi].places.splice(fromPi, 1)[0]
            groupsRef.value[gi].places.splice(pi, 0, place)
        } else {
            // Move to different group at position
            const fromGroup = groupsRef.value[fromGi]
            const toGroup = groupsRef.value[gi]
            const place = fromGroup.places.splice(fromPi, 1)[0]
            toGroup.places.splice(pi, 0, place)
        }
        
        // Update timestamps for groups and plan
        updateGroupModified(groupsRef.value[gi], now)
        if (fromGi !== gi) {
            updateGroupModified(groupsRef.value[fromGi], now)
        }
        updatePlanModified(now)
        
        dragStateRef.value.draggingPlace = null
        dragStateRef.value.overGroup = null
        dragStateRef.value.overPlaceIndex = null
    }
    
    const onDragStartGroup = (gi, e) => {
        dragStateRef.value.draggingGroup = gi
        dragStateRef.value.draggingPlace = null
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', '')
    }
    
    const onDragOverGroup = (gi, e) => {
        // Only show group drag-over when dragging a group
        if (dragStateRef.value.draggingGroup === null) return
        dragStateRef.value.overGroup = gi
        dragStateRef.value.overPlaceIndex = null
        // Reset position since groups don't have insert positions
        dragStateRef.value.dragOverPosition = null
    }
    
    const onDropOnGroup = (gi, e, updateGroupModified, updatePlanModified) => {
        e.preventDefault()
        const now = new Date().toISOString()
        
        if (dragStateRef.value.draggingGroup !== null) {
            // Reorder groups
            const fromGi = dragStateRef.value.draggingGroup
            if (fromGi !== gi) {
                const group = groupsRef.value.splice(fromGi, 1)[0]
                groupsRef.value.splice(gi, 0, group)
            }
            updatePlanModified(now)
            // Update all groups' modified timestamps since order changed
            groupsRef.value.forEach(g => updateGroupModified(g, now))
        } else if (dragStateRef.value.draggingPlace) {
            // Move place to end of group
            const { groupIndex: fromGi, placeIndex: fromPi } = dragStateRef.value.draggingPlace
            const fromGroup = groupsRef.value[fromGi]
            const toGroup = groupsRef.value[gi]
            const place = fromGroup.places.splice(fromPi, 1)[0]
            toGroup.places.push(place)
            
            updateGroupModified(toGroup, now)
            if (fromGi !== gi) {
                updateGroupModified(fromGroup, now)
            }
            updatePlanModified(now)
        }
        
        dragStateRef.value.draggingGroup = null
        dragStateRef.value.draggingPlace = null
        dragStateRef.value.overGroup = null
        dragStateRef.value.overPlaceIndex = null
        dragStateRef.value.dragOverPosition = null
    }
    
    return {
        onDragStartPlace,
        onDragOverPlace,
        onDropOnPlace,
        onDragStartGroup,
        onDragOverGroup,
        onDropOnGroup
    }
}
