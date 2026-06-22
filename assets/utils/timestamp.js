export function updateGroupModified(group, timestamp) {
    if (group && group.modified !== undefined) {
        group.modified = timestamp
    }
}

export function updatePlaceModified(place, timestamp) {
    if (place && place.modified !== undefined) {
        place.modified = timestamp
    }
}

export function updatePlanModified(plansData, currentPlanId, localStorage) {
    if (plansData && plansData.currentPlanId && plansData.plans[plansData.currentPlanId]) {
        const plan = plansData.plans[plansData.currentPlanId]
        if (plan._meta && plan._meta.modified !== undefined) {
            plan._meta.modified = new Date().toISOString()
            localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
        }
    }
}
