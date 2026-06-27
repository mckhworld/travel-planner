const PLANS_STORAGE_KEY = 'travel-map-plans'

export function getAllPlans() {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY)
    if (raw) {
        try { return JSON.parse(raw) } catch {}
    }
    return null
}

export function saveAllPlans(plansData) {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plansData))
}

export function createPlan(name, defaultGroups) {
    let plansData = getAllPlans()
    if (!plansData) {
        plansData = { currentPlanId: null, plans: {} }
    }
    let finalName = name
    let counter = 1
    while (Object.values(plansData.plans).some(p => p.name === finalName)) {
        finalName = `${name} (${counter})`
        counter++
    }
    const planId = crypto.randomUUID()
    const now = new Date().toISOString()
    const newGroups = JSON.parse(JSON.stringify(defaultGroups))
    plansData.plans[planId] = {
        id: planId,
        name: finalName,
        groups: newGroups,
        _meta: { version: '1.0', created: now, modified: now, lastSaved: now }
    }
    plansData.currentPlanId = planId
    saveAllPlans(plansData)
    return planId
}

export function deletePlan(planId) {
    const plansData = getAllPlans()
    if (!plansData || Object.keys(plansData.plans).length <= 1) return false
    delete plansData.plans[planId]
    if (plansData.currentPlanId === planId) {
        plansData.currentPlanId = Object.keys(plansData.plans)[0]
    }
    saveAllPlans(plansData)
    return true
}

export function importPlan(data, defaultGroups) {
    let plansData = getAllPlans()
    if (!plansData) {
        plansData = { currentPlanId: null, plans: {} }
    }
    const baseName = data._meta?.planName || '匯入行程'
    let planName = `${baseName}_${new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19)}`
    let counter = 1
    while (Object.values(plansData.plans).some(p => p.name === planName)) {
        planName = `${baseName}_${new Date().toISOString().replace(/[T:]/g, '-').slice(0, 19)}_${counter}`
        counter++
    }
    const planId = crypto.randomUUID()
    const now = new Date().toISOString()
    const importedGroups = data.groups.map(g => ({
        ...g,
        id: g.id || crypto.randomUUID(),
        created: g.created || now,
        modified: now,
        places: g.places.map(p => ({
            ...p,
            id: p.id || crypto.randomUUID(),
            created: p.created || now,
            modified: now
        }))
    }))
    plansData.plans[planId] = {
        id: planId,
        name: planName,
        groups: importedGroups,
        _meta: { version: '1.0', created: now, modified: now, lastSaved: now }
    }
    plansData.currentPlanId = planId
    saveAllPlans(plansData)
    return planId
}

export function loadPlan(planId) {
    const plansData = getAllPlans()
    if (!plansData || !plansData.plans[planId]) return null
    plansData.currentPlanId = planId
    saveAllPlans(plansData)
    return JSON.parse(JSON.stringify(plansData.plans[planId].groups))
}

export function loadFromLocalStorage(defaultGroups) {
    let plansData = getAllPlans()
    const oldKey = 'travel-map-data'
    const oldRaw = localStorage.getItem(oldKey)
    if (oldRaw && !plansData) {
        try {
            const oldData = JSON.parse(oldRaw)
            if (oldData.groups && Array.isArray(oldData.groups)) {
                const now = new Date().toISOString()
                const planId = crypto.randomUUID()
                const migratedGroups = oldData.groups.map(g => ({
                    id: g.id || crypto.randomUUID(),
                    name: g.name,
                    emoji: g.emoji,
                    collapsed: g.collapsed,
                    created: now,
                    modified: now,
                    places: g.places.map(p => ({
                        ...p,
                        id: p.id || crypto.randomUUID(),
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
                            _meta: { version: '1.0', created: now, modified: now, lastSaved: now }
                        }
                    }
                }
                saveAllPlans(plansData)
                localStorage.removeItem(oldKey)
            }
        } catch {}
    }
    if (!plansData) return null
    const current = plansData.plans[plansData.currentPlanId]
    if (current && Array.isArray(current.groups) && current.groups.length > 0) {
        return { plansData, groups: JSON.parse(JSON.stringify(current.groups)) }
    }
    return { plansData, groups: null }
}

export function saveToLocalStorage(plansData, currentPlanId, groups) {
    if (!plansData) return
    const current = plansData.plans[currentPlanId]
    if (current) {
        current.groups = JSON.parse(JSON.stringify(groups))
        current._meta.lastSaved = new Date().toISOString()
        saveAllPlans(plansData)
    }
}

export function downloadPlanData(plan) {
    const data = {
        id: plan.id,
        name: plan.name,
        groups: JSON.parse(JSON.stringify(plan.groups)),
        _meta: {
            version: '1.0',
            created: plan._meta.created,
            modified: plan._meta.modified,
            lastSaved: new Date().toISOString(),
            planName: plan.name
        }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${plan.name}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
}
