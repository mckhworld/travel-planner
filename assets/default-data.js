import { PLACE_TYPES } from './constants.js'

// ==================== DEFAULT DATA ====================
export const DEFAULT_DATA = {
    id: crypto.randomUUID(),
    name: '預設行程',
    groups: [
        {
            id: crypto.randomUUID(),
            name: '主要群組',
            emoji: '📌',
            collapsed: false,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            places: [
                {
                    id: crypto.randomUUID(),
                    name: '東京塔',
                    emoji: '🗼',
                    lat: 35.6586,
                    lng: 139.7454,
                    region: 'Tokyo',
                    type: 'sightseeing',
                    area: '港区',
                    hours: '09:00-23:00',
                    notes: '',
                    ai_notes: '',
                    address: '東京都港区芝公園4丁目2-8',
                    links: ['https://www.tokyotower.co.jp/'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                {
                    id: crypto.randomUUID(),
                    name: '淺草寺',
                    emoji: '⛩️',
                    lat: 35.7148,
                    lng: 139.7967,
                    region: 'Tokyo',
                    type: 'temple',
                    area: '台東區',
                    hours: '06:00-17:00',
                    notes: '',
                    ai_notes: '',
                    address: '東京都台東區淺草2丁目3-1',
                    links: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                {
                    id: crypto.randomUUID(),
                    name: '明治神宮',
                    emoji: '🏯',
                    lat: 35.6764,
                    lng: 139.6993,
                    region: 'Tokyo',
                    type: 'temple',
                    area: '澀谷區',
                    hours: '日出至日落',
                    notes: '',
                    ai_notes: '',
                    address: '東京都澀谷區代代木神園町1-1',
                    links: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                {
                    id: crypto.randomUUID(),
                    name: '新宿御苑',
                    emoji: '🌸',
                    lat: 35.6852,
                    lng: 139.7100,
                    region: 'Tokyo',
                    type: 'park',
                    area: '新宿區',
                    hours: '09:00-16:30 (週一休)',
                    notes: '',
                    ai_notes: '',
                    address: '東京都新宿區新宿御苑前町11',
                    links: ['https://www.katsuura-kyoen.go.jp/'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                {
                    id: crypto.randomUUID(),
                    name: '築地場外市場',
                    emoji: '🐟',
                    lat: 35.6654,
                    lng: 139.7707,
                    region: 'Tokyo',
                    type: 'shopping',
                    area: '中央區',
                    hours: '05:00-14:00 (週一、五日休)',
                    notes: '',
                    ai_notes: '',
                    address: '東京都中央區築地4-16',
                    links: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                {
                    id: crypto.randomUUID(),
                    name: '六本木新城',
                    emoji: '🏙️',
                    lat: 35.6604,
                    lng: 139.7292,
                    region: 'Tokyo',
                    type: 'sightseeing',
                    area: '港區',
                    hours: '10:00-23:00',
                    notes: '',
                    ai_notes: '',
                    address: '東京都港區六本木6丁目10-1',
                    links: ['https://www.roppongihills.com/'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            ]
        }
    ],
    _meta: {
        version: '1.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        lastSaved: new Date().toISOString()
    }
}
