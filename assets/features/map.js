import { watch, nextTick } from 'vue'
import * as L from 'leaflet'

export function createMapFeature(mapRef, markersRef, mapPickModeRef, pickMarkerRef, currentPlaceRef, selectPlaceFn) {
    let map = null
    let markers = {}
    
    const initMap = () => {
        const mapEl = document.getElementById('map')
        map = L.map('map', {
            preferCanvas: false,
            zoomAnimation: false,
            markerZoomAnimation: false
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)
        map.setView([36.2, 139.3], 9)
        
        // Fix tile container dimensions (Leaflet bug with flex layout)
        const fixTileContainer = () => {
            const tc = mapEl.querySelector('.leaflet-tile-container')
            if (tc) {
                tc.style.width = mapEl.offsetWidth + 'px'
                tc.style.height = mapEl.offsetHeight + 'px'
                tc.style.position = 'absolute'
                tc.style.top = '0'
                tc.style.left = '0'
            }
        }
        
        setTimeout(() => { map.invalidateSize(); fixTileContainer() }, 100)
        setTimeout(() => { map.invalidateSize(); fixTileContainer() }, 500)
        setTimeout(() => { map.invalidateSize(); fixTileContainer() }, 1000)
        
        map.on('click', (e) => {
            if (mapPickModeRef.value && currentPlaceRef.value) {
                currentPlaceRef.value.lat = e.latlng.lat
                currentPlaceRef.value.lng = e.latlng.lng
                updateMarkers()
                // Place marker at picked location
                if (pickMarkerRef.value) map.removeLayer(pickMarkerRef.value)
                pickMarkerRef.value = L.marker([e.latlng.lat, e.latlng.lng], {
                    icon: L.divIcon({
                        className: 'pick-marker',
                        html: '<div style="background-color: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
                        iconSize: [20, 20], iconAnchor: [10, 10]
                    })
                }).addTo(map)
                mapPickModeRef.value = false
            } else {
                closeDetail()
            }
        })
    }
    
    const updateMarkers = (groupsRef, PLACE_TYPES, getGroupColor, getRegionName, buildMapsLink) => {
        const groups = groupsRef
        Object.values(markers).forEach(m => map.removeLayer(m))
        markers = {}
        if (pickMarkerRef.value) { map.removeLayer(pickMarkerRef.value); pickMarkerRef.value = null }
        
        groups.value.forEach((group, gi) => {
            group.places.forEach((place, pi) => {
                if (!place.lat || !place.lng) return
                const typeInfo = PLACE_TYPES[place.type] || PLACE_TYPES['other']
                const marker = L.marker([place.lat, place.lng], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background-color: ${typeInfo.color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">${place.emoji || '📍'}</div>`,
                        iconSize: [28, 28], iconAnchor: [14, 14]
                    })
                }).addTo(map)
                marker.bindPopup(`
                    <h3>${place.emoji || '📍'} ${place.name} ${!place.lat || !place.lng ? '🚫' : ''}</h3>
                    <span class="region-badge" style="background-color: ${getGroupColor(gi, groupsRef)}">${getRegionName(place.region)}</span>
                    <span class="type-badge" style="background-color: ${typeInfo.color}">${typeInfo.name}</span>
                    ${place.hours ? `<p style="margin-top: 6px; font-size: 12px;">🕐 ${place.hours}</p>` : ''}
                    <a href="${buildMapsLink(place)}" target="_blank" class="popup-link">📍 Google Maps</a>
                `)
                marker.on('click', () => selectPlaceFn(gi, pi))
                markers[place.id] = marker
            })
        })
        
        const nonNullMarkers = Object.values(markers)
        if (nonNullMarkers.length > 0) {
            const group = L.featureGroup(nonNullMarkers)
            map.fitBounds(group.getBounds().pad(0.1))
        }
    }
    
    // Watch for groups changes to update markers
    const setupGroupsWatch = (groupsRef, saveToLocalStorage) => {
        watch(groupsRef, () => {
            nextTick(() => updateMarkers())
            // Update place modified timestamps on any change
            const now = new Date().toISOString()
            groupsRef.value.forEach(g => {
                g.places.forEach(p => {
                    if (p && p.modified !== undefined) {
                        p.modified = now
                    }
                })
            })
            saveToLocalStorage()
        }, { deep: true })
    }
    
    return {
        initMap,
        updateMarkers,
        setupGroupsWatch
    }
}
