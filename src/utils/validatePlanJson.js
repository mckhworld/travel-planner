export function validatePlanJson(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { valid: false, error: 'JSON 必須是物件' }
    }

    if (!data.name || typeof data.name !== 'string') {
        return { valid: false, error: '缺少 name 欄位' }
    }

    if (!Array.isArray(data.groups) || data.groups.length === 0) {
        return { valid: false, error: '缺少 groups 陣列或為空' }
    }

    for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i]
        if (!g || typeof g !== 'object') {
            return { valid: false, error: `群組 ${i} 格式不正確` }
        }
        if (!g.name || typeof g.name !== 'string') {
            return { valid: false, error: `群組 ${i} 缺少 name` }
        }
        if (!Array.isArray(g.places)) {
            return { valid: false, error: `群組 "${g.name}" 缺少 places 陣列` }
        }
        for (let j = 0; j < g.places.length; j++) {
            const p = g.places[j]
            if (!p || typeof p !== 'object') {
                return { valid: false, error: `群組 "${g.name}" 的地點 ${j} 格式不正確` }
            }
            if (!p.name) {
                return { valid: false, error: `群組 "${g.name}" 的地點 ${j} 缺少 name` }
            }
        }
    }

    return { valid: true }
}
