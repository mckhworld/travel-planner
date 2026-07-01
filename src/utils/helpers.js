export function getRegionName(region) {
    const REGION_NAMES = {
        'Tokyo': '東京', 'Kanagawa': '神奈川', 'Saitama': '埼玉',
        'Chiba': '千叶', 'Gunma': '群馬', 'Nagano': '長野',
        'Yamanashi': '山梨', 'Shizuoka': '靜岡', 'Osaka': '大阪',
        'Kyoto': '京都', 'Hokkaido': '北海道', 'Fukuoka': '福岡'
    }
    return REGION_NAMES[region] || region || ''
}

export function buildMapsLink(place) {
    const regionName = getRegionName(place.region)
    const parts = [place.name, place.address, place.area, regionName].filter(Boolean)
    const query = parts.join(' ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&hl=zh-TW`
}

export function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return '剛剛'
    if (mins < 60) return `${mins}分鐘前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小時前`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}天前`
    return d.toLocaleDateString('zh-TW')
}

export function updateGroupModified(group, timestamp) {
    if (group && group.modified !== undefined) {
        group.modified = timestamp
    }
}

export function updatePlanModified(plansData, planId, timestamp) {
    if (plansData && planId && plansData.plans[planId]) {
        const plan = plansData.plans[planId]
        if (plan._meta && plan._meta.modified !== undefined) {
            plan._meta.modified = timestamp
            localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
        }
    }
}
