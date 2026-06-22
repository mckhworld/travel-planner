// Storage utilities for localStorage operations
const PLANS_STORAGE_KEY = 'travel-map-plans'

export function getAllPlans() {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY)
    if (raw) {
        try { return JSON.parse(raw) } catch {}
    }
    return null
}

export function saveToLocalStorage(groups) {
    const plansData = getAllPlans()
    if (!plansData) return
    const current = plansData.plans[plansData.currentPlanId]
    if (current) {
        current.groups = JSON.parse(JSON.stringify(groups))
        const now = new Date().toISOString()
        current._meta.lastSaved = now
        localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plansData))
    }
}

export function loadFromLocalStorage(groupsRef) {
    let plansData = getAllPlans()
    // Migration: check old single-plan key
    const oldKey = 'travel-map-data'
    const oldRaw = localStorage.getItem(oldKey)
    if (oldRaw && !plansData) {
        try {
            const oldData = JSON.parse(oldRaw)
            if (oldData.groups && Array.isArray(oldData.groups)) {
                const now = new Date().toISOString()
                // Convert old plan to UUID-based format with timestamps
                const planId = crypto.randomUUID()
                
                // Migrate groups with IDs and timestamps
                const migratedGroups = oldData.groups.map(g => ({
                    id: g.id || crypto.randomUUID(),
                    name: g.name,
                    emoji: g.emoji,
                    collapsed: g.collapsed,
                    created: now,
                    modified: now,
                    places: g.places.map(p => ({
                        id: p.id || crypto.randomUUID(),
                        name: p.name,
                        emoji: p.emoji,
                        lat: p.lat,
                        lng: p.lng,
                        region: p.region,
                        type: p.type,
                        area: p.area,
                        hours: p.hours,
                        notes: p.notes,
                        ai_notes: p.ai_notes,
                        address: p.address,
                        links: p.links || [],
                        created: now,
                        modified: now
                    }))
                }))
                
                plansData = {
                    currentPlanId: planId,
                    plans: { 
                        [planId]: {
                            id: planId,
                            name: oldData.name || '預設行程',
                            groups: migratedGroups,
                            _meta: {
                                version: '1.0',
                                created: now,
                                modified: now,
                                lastSaved: now
                            }
                        }
                    }
                }
                localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plansData))
                localStorage.removeItem(oldKey)
            }
        } catch {}
    }
    if (!plansData) return null
    const current = plansData.plans[plansData.currentPlanId]
    if (current && Array.isArray(current.groups) && current.groups.length > 0) {
        groupsRef.value = JSON.parse(JSON.stringify(current.groups))
    }
    return plansData
}
