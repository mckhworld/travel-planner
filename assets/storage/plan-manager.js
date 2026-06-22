import { DEFAULT_DATA } from '../default-data.js'
import { saveToLocalStorage, getAllPlans } from './localStorage-utils.js'

export function createPlan(name) {
    let plansData = getAllPlans()
    if (!plansData) {
        plansData = { currentPlanId: null, plans: {} }
    }
    // Ensure unique name
    let finalName = name
    let counter = 1
    while (Object.values(plansData.plans).some(p => p.name === finalName)) {
        finalName = `${name} (${counter})`
        counter++
    }
    const planId = crypto.randomUUID()
    
    // Create groups with timestamps
    const now = new Date().toISOString()
    const defaultGroups = JSON.parse(JSON.stringify(DEFAULT_DATA.groups))
    const newGroups = defaultGroups.map(g => ({
        ...g,
        id: crypto.randomUUID(),
        created: now,
        modified: now,
        places: g.places.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            created: now,
            modified: now
        }))
    }))
    
    plansData.plans[planId] = {
        id: planId,
        name: finalName,
        groups: newGroups,
        _meta: { 
            version: '1.0',
            created: now,
            modified: now,
            lastSaved: now
        }
    }
    plansData.currentPlanId = planId
    localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
    return planId
}

export function deletePlan(planId) {
    const plansData = getAllPlans()
    if (!plansData || Object.keys(plansData.plans).length <= 1) return false
    delete plansData.plans[planId]
    // If deleted current, load first available
    if (plansData.currentPlanId === planId) {
        const remaining = Object.keys(plansData.plans)[0]
        plansData.currentPlanId = remaining
    }
    localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
    return true
}

export function importPlan(data) {
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
    
    // Import groups with timestamps
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
        _meta: { 
            version: '1.0',
            created: now,
            modified: now,
            lastSaved: now
        }
    }
    plansData.currentPlanId = planId
    localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
    return planId
}

export function loadPlan(planId) {
    const plansData = getAllPlans()
    if (!plansData || !plansData.plans[planId]) return false
    plansData.currentPlanId = planId
    localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
    return true
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
