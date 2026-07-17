import { ref } from 'vue'

export function useLiveLocation() {
    const active = ref(false)
    const coords = ref(null)      // [lng, lat]
    const accuracy = ref(null)    // meters
    const error = ref(null)       // error message string

    let watchId = null

    const start = (onPosition) => {
        if (!navigator.geolocation) {
            error.value = '此瀏覽器不支援定位功能'
            active.value = false
            return
        }
        if (watchId !== null) return // already watching

        active.value = true
        error.value = null

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy: acc } = position.coords
                coords.value = [longitude, latitude]
                accuracy.value = acc
                if (onPosition) onPosition(coords.value, acc)
            },
            (geoError) => {
                const messages = {
                    1: '定位權限已被拒絕',
                    2: '無法取得定位資料',
                    3: '定位請求超時'
                }
                error.value = messages[geoError.code] || '定位失敗'
                active.value = false
                watchId = null
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
        )
    }

    const stop = () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId)
            watchId = null
        }
        active.value = false
        coords.value = null
        accuracy.value = null
    }

    const toggle = (onPosition) => {
        if (active.value) {
            stop()
        } else {
            start(onPosition)
        }
    }

    return { active, coords, accuracy, error, start, stop, toggle }
}
