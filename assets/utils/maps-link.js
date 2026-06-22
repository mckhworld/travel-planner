export function buildMapsLink(place) {
    const parts = [place.name, place.area, place.address].filter(Boolean)
    const query = parts.join(' ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&hl=zh-TW`
}
