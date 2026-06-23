import { REGION_NAMES, REGION_COLOR_PALETTE } from '../constants.js'

// Get region color based on region name
export function getRegionColor(region, groups) {
    if (!region) return '#999'
    // Re-implement filterRegions logic
    const s = new Set()
    if (!groups || !groups.value) return '#999'
    groups.value.forEach(g => g.places.forEach(p => { if (p.region) s.add(p.region) }))
    const filterRegions = [...s].sort()
    
    const idx = filterRegions.indexOf(region)
    if (idx >= 0) return REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]
    const existingColors = new Set(REGION_COLOR_PALETTE.filter(c => groups.value.some(g => getGroupColorByName(g.name, null) === c)))
    return REGION_COLOR_PALETTE.find(c => !existingColors.has(c)) || '#999'
}

// Get group color by index
export function getGroupColor(gi, groups) {
    if (!groups || !groups.value) return '#999'
    return getGroupColorByName(groups.value[gi].name, null)
}

// Get group color by name
export function getGroupColorByName(name, filterRegionsRef = null) {
    if (!filterRegionsRef || !filterRegionsRef.value) {
        // Re-implement filterRegions logic
        const s = new Set()
        if (filterRegionsRef && filterRegionsRef.value) {
            const idx = filterRegionsRef.value.indexOf(name)
            if (idx >= 0) return REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]
        }
        // If filterRegions is not provided, return default color
        return '#999'
    }
    const idx = filterRegionsRef.value.indexOf(name)
    if (idx >= 0) return REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]
    return '#999'
}

// Get region name (translated)
export function getRegionName(region) {
    return REGION_NAMES[region] || region || ''
}

// Build Google Maps link for a place
export function buildMapsLink(place) {
    const parts = [place.name, place.area, place.address].filter(Boolean)
    const query = parts.join(' ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&hl=zh-TW`
}

// Handle file upload for importing plans
export function handleFileUpload(e, onImport) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result)
            onImport(data)
        } catch (err) {
            console.error('Failed to parse file:', err)
        }
    }
    reader.readAsText(file)
}
