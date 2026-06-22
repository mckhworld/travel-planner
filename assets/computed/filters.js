import { computed } from 'vue'

export function createComputedProperties(groups, filter, PLACE_TYPES) {
    const refreshPlanRefs = (getAllPlans, allPlansObjRef, currentPlanNameRef, allPlansListRef) => {
        const plansData = getAllPlans()
        allPlansObjRef.value = plansData?.plans || {}
        currentPlanNameRef.value = (plansData?.currentPlanId && plansData.plans[plansData.currentPlanId])
            ? plansData.plans[plansData.currentPlanId].name
            : ''
        allPlansListRef.value = plansData ? Object.entries(plansData.plans).map(([id, plan]) => ({ id, ...plan })) : []
    }

    const totalPlaces = computed(() => groups.value.reduce((s, g) => s + g.places.length, 0))
    const totalTypes = computed(() => {
        const t = new Set()
        groups.value.forEach(g => g.places.forEach(p => t.add(p.type)))
        return t.size
    })
    const existingRegions = computed(() => {
        const s = new Set()
        groups.value.forEach(g => g.places.forEach(p => { if (p.region) s.add(p.region) }))
        return [...s].sort()
    })
    const existingAreas = computed(() => {
        const s = new Set()
        groups.value.forEach(g => g.places.forEach(p => { if (p.area) s.add(p.area) }))
        return [...s].sort()
    })
    const existingTypes = computed(() => {
        const s = new Set()
        // Add all predefined types from PLACE_TYPES
        Object.keys(PLACE_TYPES).forEach(t => s.add(t))
        // Also add any custom types used by places
        groups.value.forEach(g => g.places.forEach(p => { if (p.type) s.add(p.type) }))
        return [...s].sort()
    })
    const filterRegions = computed(() => {
        const s = new Set()
        groups.value.forEach(g => g.places.forEach(p => { if (p.region) s.add(p.region) }))
        return [...s].sort()
    })
    const filterTypes = computed(() => {
        const s = new Set()
        groups.value.forEach(g => g.places.forEach(p => { if (p.type) s.add(p.type) }))
        return [...s].sort()
    })

    const filteredGroups = computed(() => {
        let result = groups.value
        if (filter.type) {
            result = result.map(g => ({ ...g, places: g.places.filter(p => p.type === filter.type) }))
                .filter(g => g.places.length > 0)
        }
        if (filter.search) {
            const q = filter.search.toLowerCase()
            result = result.map(g => ({ ...g, places: g.places.filter(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.region || '').toLowerCase().includes(q) ||
                (p.area || '').toLowerCase().includes(q)
            ) })).filter(g => g.places.length > 0)
        }
        return result
    })

    const findRealGroupIdx = (filteredGi, filteredGroupsValue, groupsValue) => {
        let count = 0
        for (let i = 0; i < groupsValue.length; i++) {
            const matchPlaces = groupsValue[i].places.filter(p => {
                if (filter.type && p.type !== filter.type) return false
                if (filter.search) {
                    const q = filter.search.toLowerCase()
                    return (p.name || '').toLowerCase().includes(q) ||
                           (p.region || '').toLowerCase().includes(q) ||
                           (p.area || '').toLowerCase().includes(q)
                }
                return true
            })
            if (matchPlaces.length > 0) {
                if (count === filteredGi) return i
                count++
            }
        }
        return 0
    }

    return {
        refreshPlanRefs,
        totalPlaces,
        totalTypes,
        existingRegions,
        existingAreas,
        existingTypes,
        filterRegions,
        filterTypes,
        filteredGroups,
        findRealGroupIdx
    }
}
