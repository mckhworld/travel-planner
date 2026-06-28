<template>
    <div class="top-header">
        <button class="hamburger-icon" @click="toggleMobileSidebar">☰</button>
        <span class="app-title">🗾 旅行地圖</span>
        <span class="plan-name" v-if="currentPlanNameRef">· {{ currentPlanNameRef }}</span>
        <button class="plan-switch-btn" @click="showPlanSelector = !showPlanSelector">📋</button>
    </div>

    <div id="main-content">
        <div id="sidebar" :class="{ 'mobile-open': mobileSidebarOpen }">
            <div id="sidebar-header">
                <h1>🗾 旅行地圖</h1>
            </div>
            <div class="search-filter">
                <input v-model="filter.search" placeholder="🔍 搜尋地點、地區、區域、群組..." />
            </div>
            <div class="legend">
                <h3>🎨 地點類型</h3>
                <div class="legend-items">
                    <template v-for="type in filterTypes" :key="type">
                        <div class="legend-item" :class="{ active: filter.type === type }"
                             @click="filter.type = filter.type === type ? null : type"
                             style="cursor: pointer;">
                            <span class="legend-dot" :style="{ backgroundColor: PLACE_TYPES[type]?.color || '#999' }"></span>{{ PLACE_TYPES[type]?.name || type }}
                        </div>
                    </template>
                </div>
            </div>
            <div id="places-list">
                <template v-for="(group, gi) in filteredGroups" :key="group.id">
                    <div class="region-group"
                         :class="{ 'drag-over': dragState.overGroup === gi && !dragState.overPlaceIndex }"
                         @dragover.prevent="onDragOverGroup(gi, $event)"
                         @drop="onDropOnGroup(gi, $event)">
                        <h2 :style="{ color: getGroupColor(gi), backgroundColor: getGroupColor(gi) + '15' }"
                            @click="group.collapsed = !group.collapsed">
                            <span class="group-name" @click.stop>{{ group.emoji }} {{ group.name }} ({{ group.places.length }})</span>
                            <button class="delete-group-btn" @click.stop="deleteGroup(gi)" v-if="filteredGroups.length > 1">✕</button>
                        </h2>
                        <div class="region-content" v-show="!group.collapsed">
                            <div v-for="(place, pi) in group.places" :key="place.id"
                                  class="place-item"
                                  :data-place-id="place.id"
                                  :class="{
                                      selected: selectedPlace && selectedPlace.groupIndex === gi && selectedPlace.placeIndex === pi,
                                      'drag-over': dragState.overGroup === gi && dragState.overPlaceIndex === pi
                                  }"
                                  :style="{ borderLeftColor: PLACE_TYPES[place.type]?.color || '#999' }"
                                  draggable="true"
                                 @dragstart="onDragStartPlace(gi, pi, $event)"
                                 @dragover.prevent="onDragOverPlace(gi, pi, $event)"
                                 @drop="onDropOnPlace(gi, pi, $event)"
                                 @click="selectFilteredPlace(gi, pi)">
                                <div class="name">{{ place.emoji || '📍' }} {{ place.name || '未命名' }}
                                    <span class="type-badge" :style="{ backgroundColor: PLACE_TYPES[place.type]?.color || '#607D8B' }">{{ PLACE_TYPES[place.type]?.name || place.type }}</span>
                                    <span v-if="!place.lat || !place.lng" class="no-coords-badge" title="Missing coordinates">🚫</span>
                                </div>
                                <div class="region">{{ getRegionName(place.region) }} · {{ place.area || '' }}</div>
                            </div>
                            <div v-if="dragState.overGroup === gi && dragState.draggingPlace !== null && dragState.overPlaceIndex === null" class="place-placeholder" @dragover.prevent="onDragOverGroupEnd(gi, $event)" @drop="onDropOnPlace(gi, group.places.length, $event)"></div>
                            <button class="add-place-btn" @click="addPlace(gi)">+ 新增地點</button>
                        </div>
                    </div>
                </template>
                <div v-if="filteredGroups.every(g => g.places.length === 0)" class="no-results">
                    尚無地點，點擊「新增地點」開始建立
                </div>
            </div>
            <div class="add-group-section">
                <template v-if="!showAddGroupForm">
                    <button @click="showAddGroupForm = true">+ 新增群組</button>
                </template>
                <div v-else class="add-group-form">
                    <input v-model="newGroupForm.name" placeholder="群組名稱" @keyup.enter="addGroup" />
                    <div class="emoji-field" style="width: auto;">
                        <input :value="newGroupForm.emoji" @input="newGroupForm.emoji = $event.target.value" placeholder="📌" style="height: 34px; font-size: 16px;" />
                        <button @click="openEmojiPicker({ type: 'group', groupIndex: groups.length })" style="height: 34px; font-size: 16px;">🎨</button>
                    </div>
                    <button @click="addGroup" style="background:#27ae60;color:white;">✓</button>
                    <button @click="showAddGroupForm = false" style="background:#fee;color:#e74c3c;">✕</button>
                </div>
            </div>
        </div>

        <div id="detail-panel" :class="{ expanded: selectedPlace, 'mobile-hidden': isMobile && mobileSidebarOpen }">
            <div class="detail-content" v-if="selectedPlace" @scroll.stop @click="closeDropdowns">
                <div class="detail-header">
                    <div class="detail-title">{{ currentPlace.emoji || '📍' }} {{ currentPlace.name || '未命名' }}</div>
                    <button class="detail-close" @click="closeDetail">✕</button>
                </div>
                <div class="form-row">
                    <div class="form-field emoji-field">
                        <label>圖示</label>
                        <input :value="currentPlace.emoji || '📍'" @input="currentPlace.emoji = $event.target.value" placeholder="📍" />
                        <button @click="openEmojiPicker({ type: 'place', groupIndex: selectedPlace.groupIndex, placeIndex: selectedPlace.placeIndex })">🎨</button>
                    </div>
                    <div class="form-field">
                        <label>名稱</label>
                        <input v-model="currentPlace.name" placeholder="地點名稱" />
                    </div>
                </div>
                <div class="form-field">
                    <label>座標 (lat, lng)</label>
                    <input type="text" v-model="coordsInput" placeholder="35.6586, 139.7454" />
                </div>
                <div class="form-field" style="text-align: center;">
                    <button @click="enableMapPick" :style="mapPickMode ? {background:'#e74c3c',color:'white'} : {background:'#667eea',color:'white'}" style="padding: 10px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        {{ mapPickMode ? '📍 點擊地圖取消' : '📍 在地圖上選擇座標' }}
                    </button>
                    <div v-if="mapPickMode" style="font-size: 11px; color: #667eea; margin-top: 4px;">點擊地圖選取座標</div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>地區</label>
                        <div class="smart-input">
                            <input v-model="currentPlace.region" :placeholder="existingRegions.length ? '選取或輸入新地區' : '輸入地區'" @focus="currentPlace.id && (dropdownVisibility[currentPlace.id + '_region'] = true)" @blur="currentPlace.id && (dropdownVisibility[currentPlace.id + '_region'] = false)" @click.stop />
                            <div v-if="currentPlace.id && dropdownVisibility[currentPlace.id + '_region']" class="smart-dropdown">
                                <div v-for="r in existingRegions" :key="r" @mousedown="selectRegion(r)">{{ r }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-field">
                        <label>類型</label>
                        <div class="smart-input">
                            <input :value="PLACE_TYPES[currentPlace.type]?.name || currentPlace.type" @input="updateFieldType($event)" :placeholder="existingTypes.length ? '選取或輸入新類型' : '輸入類型'" @focus="currentPlace.id && (dropdownVisibility[currentPlace.id + '_type'] = true)" @blur="currentPlace.id && (dropdownVisibility[currentPlace.id + '_type'] = false)" @click.stop />
                            <div v-if="currentPlace.id && dropdownVisibility[currentPlace.id + '_type']" class="smart-dropdown">
                                <div v-for="t in existingTypes" :key="t" @mousedown="selectType(t)">{{ PLACE_TYPES[t]?.name || t }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-field">
                    <label>區域</label>
                    <div class="smart-input">
                        <input v-model="currentPlace.area" :placeholder="existingAreas.length ? '選取或輸入新區域' : '輸入區域'" @focus="currentPlace.id && (dropdownVisibility[currentPlace.id + '_area'] = true)" @blur="currentPlace.id && (dropdownVisibility[currentPlace.id + '_area'] = false)" @click.stop />
                        <div v-if="currentPlace.id && dropdownVisibility[currentPlace.id + '_area']" class="smart-dropdown">
                            <div v-for="a in existingAreas" :key="a" @mousedown="selectArea(a)">{{ a }}</div>
                        </div>
                    </div>
                </div>
                <div class="form-field">
                    <label>營業時間</label>
                    <input v-model="currentPlace.hours" placeholder="例如: 10:00-18:00" />
                </div>
                <div class="form-field">
                    <label>備註</label>
                    <textarea v-model="currentPlace.notes" rows="2" placeholder="個人備註"></textarea>
                </div>
                <div class="form-field">
                    <label>AI 研究筆記</label>
                    <textarea v-model="currentPlace.ai_notes" rows="2" placeholder="AI 研究結果"></textarea>
                </div>
                <div class="form-field">
                    <label>地址</label>
                    <textarea v-model="currentPlace.address" rows="2" placeholder="完整地址"></textarea>
                </div>
                <div class="form-field">
                    <label>連結</label>
                    <div v-for="(link, i) in currentPlace.links" :key="i" class="link-row">
                        <input v-model="currentPlace.links[i]" placeholder="https://..." @input="updatePlaceLinks(currentPlace, currentPlace.links)" />
                        <button @click="currentPlace.links.splice(i, 1); updatePlaceLinks(currentPlace, currentPlace.links)" v-if="currentPlace.links.length > 1">✕</button>
                    </div>
                    <button class="add-link-btn" @click="currentPlace.links.push(''); updatePlaceLinks(currentPlace, currentPlace.links)">+ 新增連結</button>
                </div>
                <div class="form-actions">
                    <span class="save-status">💾 已自動儲存</span>
                    <a :href="buildMapsLink(currentPlace)" target="_blank" class="detail-link">📍 Google Maps 搜尋</a>
                    <button class="duplicate-place-btn" @click="duplicatePlace(selectedPlace.groupIndex, selectedPlace.placeIndex)">📋 複製地點</button>
                    <button class="delete-place-btn" @click="deletePlace(selectedPlace.groupIndex, selectedPlace.placeIndex)">🗑️ 刪除地點</button>
                </div>
            </div>
        </div>

        <div id="map" :class="{ 'pick-mode': mapPickMode }"></div>

        <div class="plan-selector-overlay" v-if="showPlanSelector" @click="showPlanSelector = false"></div>
        <div class="plan-selector-panel" :class="{ open: showPlanSelector }">
            <div class="plan-selector-header">
                <h3>📋 行程管理</h3>
                <button class="plan-selector-close" @click="showPlanSelector = false">✕</button>
            </div>
            <template v-if="showPlanCreateInput">
                <div class="plan-create-input-row" style="flex-direction:column; gap:6px;">
                    <input v-model="newPlanName" placeholder="行程名稱" @keyup.enter="doCreatePlan" />
                    <div style="display:flex; gap:6px;">
                        <button @click="doCreatePlan">✓ 建立</button>
                        <button @click="showPlanCreateInput = false" style="background:#fee; color:#e74c3c;">✕</button>
                    </div>
                </div>
                <div class="plan-error-msg" v-if="createPlanError">{{ createPlanError }}</div>
            </template>
            <div class="plan-selector-body">
                <div v-for="(plan, idx) in allPlansListRef" :key="plan.id"
                     class="plan-list-item" :class="{ active: currentPlanIdVal === plan.id }">
                    <div class="plan-info">
                        <template v-if="editingPlanId === plan.id">
                            <input :value="editingPlanName" @keyup.enter="doRenamePlan(plan.id)" @blur="handleRenameBlur(plan.id)" @keyup.escape="cancelRenamePlan" @input="editingPlanName = $event.target.value" style="font-weight:600;font-size:14px;color:#333;border:2px solid #667eea;border-radius:4px;padding:2px 4px;width:100%;outline:none;" />
                        </template>
                        <div v-else class="plan-info-name">{{ plan.name }}</div>
                        <div class="plan-info-meta">
                            {{ plan.groups?.length || 0 }} 個群組 · {{ plan.groups?.reduce((s,g) => s + g.places.length, 0) || 0 }} 地點
                            · {{ formatDate(plan._meta?.lastSaved) }}
                        </div>
                    </div>
                    <div class="plan-actions">
                        <button class="plan-load-btn" @click.stop="doLoadPlan(plan.id)" title="載入行程">載入</button>
                        <button class="plan-download-btn" @click.stop="downloadPlanData(plan)" title="下載行程">📥</button>
                        <button class="plan-rename-btn" @click.stop="startRenamePlan(plan)" title="重新命名">✏️</button>
                        <button class="plan-delete-btn" @click.stop="doDeletePlan(plan.id)" v-if="Object.keys(allPlansObjRef).length > 1" title="刪除行程">刪除</button>
                    </div>
                </div>
                <div class="plan-list-empty" v-if="!allPlansListRef || allPlansListRef.length === 0">
                    尚無行程，點擊「新增行程」開始
                </div>
            </div>
            <div class="plan-selector-actions">
                <button class="plan-create-btn" @click="showPlanCreateInput = true">➕ 新增行程</button>
                <input type="file" ref="importFileInput" accept=".json" style="display:none" @change="handlePlanImport" />
                <button class="plan-import-btn" @click="$refs.importFileInput.click()">📤 匯入行程</button>
            </div>
        </div>

        <div class="emoji-picker-panel" :class="{ expanded: showEmojiPicker }">
            <div class="emoji-picker-content" @click.stop>
                <div class="emoji-picker-header">
                    <h4>選擇圖示</h4>
                    <button class="emoji-picker-close" @click="closeEmojiPicker">✕</button>
                </div>
                <div class="emoji-grid">
                    <button v-for="emoji in COMMON_EMOJIS" :key="emoji" @click="selectEmoji(emoji)">{{ emoji }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import { PLACE_TYPES, REGION_NAMES, COMMON_EMOJIS, REGION_COLOR_PALETTE } from './data/constants.js'
import { createDefaultData } from './data/default-data.js'
import { getRegionName, buildMapsLink, formatDate, updateGroupModified, updatePlanModified } from './utils/helpers.js'
import {
    getAllPlans, saveToLocalStorage, loadFromLocalStorage,
    createPlan as createPlanStorage, deletePlan as deletePlanStorage,
    importPlan as importPlanStorage, loadPlan as loadPlanStorage,
    downloadPlanData
} from './utils/storage.js'

const groups = ref([])
const selectedPlace = ref(null)
const dropdownVisibility = reactive({})
const filter = reactive({ search: '', region: null, type: null })
const showEmojiPicker = ref(false)
const emojiPickerTarget = ref(null)
const showAddGroupForm = ref(false)
const newGroupForm = reactive({ name: '', emoji: '📌' })
const dragState = reactive({ draggingPlace: null, draggingGroup: null, overGroup: null, overPlaceIndex: null, dragOverPosition: null })
const isMobile = ref(false)
const mobileSidebarOpen = ref(false)
const showPlanSelector = ref(false)
const showPlanCreateInput = ref(false)
const newPlanName = ref('')
const createPlanError = ref('')
const importFileInput = ref(null)
const editingPlanId = ref(null)
const editingPlanName = ref('')
const currentPlanIdVal = ref(null)
const allPlansObjRef = ref({})
const allPlansListRef = ref([])
const currentPlanNameRef = ref('')
const mapPickMode = ref(false)

let map = null
let markers = {}
let pickMarker = null

const currentPlace = computed(() => {
    const sp = selectedPlace.value
    if (sp && sp.groupIndex != null && sp.placeIndex != null) {
        return groups.value[sp.groupIndex]?.places[sp.placeIndex] || {}
    }
    return {}
})

const coordsInput = computed({
    get: () => {
        const p = currentPlace.value
        if (p) return `${p.lat}, ${p.lng}`
        return ''
    },
    set: (val) => {
        const p = currentPlace.value
        if (p) {
            const match = val.match(/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/)
            if (match) {
                const parts = val.split(',').map(s => parseFloat(s.trim()))
                p.lat = parts[0]
                p.lng = parts[1]
            }
        }
    }
})

const totalPlaces = computed(() => groups.value.reduce((s, g) => s + g.places.length, 0))
const totalTypes = computed(() => {
    const t = new Set()
    groups.value.forEach(g => g.places.forEach(p => t.add(p.type)))
    return t.size
})

const existingRegions = computed(() => {
    const s = new Set()
    groups.value.forEach(g => g.places.forEach(p => { if (p.region) s.add(p.region) }))
    return [...s].sort()
})

const existingAreas = computed(() => {
    const s = new Set()
    groups.value.forEach(g => g.places.forEach(p => { if (p.area) s.add(p.area) }))
    return [...s].sort()
})

const existingTypes = computed(() => {
    const s = new Set()
    Object.keys(PLACE_TYPES).forEach(t => s.add(t))
    groups.value.forEach(g => g.places.forEach(p => { if (p.type) s.add(p.type) }))
    return [...s].sort()
})

const filterRegions = computed(() => {
    const s = new Set()
    groups.value.forEach(g => g.places.forEach(p => { if (p.region) s.add(p.region) }))
    return [...s].sort()
})

const filterTypes = computed(() => {
    const s = new Set()
    groups.value.forEach(g => g.places.forEach(p => { if (p.type) s.add(p.type) }))
    return [...s].sort()
})

const filteredGroups = computed(() => {
    let result = groups.value
    if (filter.type) {
        result = result.map(g => ({ ...g, places: g.places.filter(p => p.type === filter.type) }))
            .filter(g => g.places.length > 0)
    }
    if (filter.search) {
        const q = filter.search.toLowerCase()
        result = result.map(g => ({ ...g, places: g.places.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.region || '').toLowerCase().includes(q) ||
            (p.area || '').toLowerCase().includes(q)
        ) })).filter(g => g.places.length > 0)
    }
    return result
})

const refreshPlanRefs = () => {
    const plansData = getAllPlans()
    allPlansObjRef.value = plansData?.plans || {}
    currentPlanNameRef.value = (plansData?.currentPlanId && plansData.plans[plansData.currentPlanId])
        ? plansData.plans[plansData.currentPlanId].name
        : ''
    allPlansListRef.value = plansData ? Object.entries(plansData.plans).map(([id, plan]) => ({ id, ...plan })) : []
}

const getGroupColorByName = (name) => {
    const idx = filterRegions.value.indexOf(name)
    if (idx >= 0) return REGION_COLOR_PALETTE[idx % REGION_COLOR_PALETTE.length]
    return '#9E9E9E'
}

const getGroupColor = (gi) => getGroupColorByName(groups.value[gi].name)

const findRealGroupIdx = (filteredGi) => {
    let count = 0
    for (let i = 0; i < groups.value.length; i++) {
        const matchPlaces = groups.value[i].places.filter(p => {
            if (filter.type && p.type !== filter.type) return false
            if (filter.search) {
                const q = filter.search.toLowerCase()
                return (p.name || '').toLowerCase().includes(q) ||
                       (p.region || '').toLowerCase().includes(q) ||
                       (p.area || '').toLowerCase().includes(q)
            }
            return true
        })
        if (matchPlaces.length > 0) {
            if (count === filteredGi) return i
            count++
        }
    }
    return 0
}

const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
    if (!isMobile.value) mobileSidebarOpen.value = false
}

const toggleMobileSidebar = () => {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    if (mobileSidebarOpen.value && selectedPlace.value) closeDetail()
}

const selectPlace = (gi, pi, centerMap = true) => {
    selectedPlace.value = { groupIndex: gi, placeIndex: pi }
    const place = groups.value[gi].places[pi]
    dropdownVisibility[place.id + '_region'] = false
    dropdownVisibility[place.id + '_area'] = false
    if (isMobile.value) mobileSidebarOpen.value = false
    nextTick(() => {
        const el = document.querySelector(`.place-item[data-place-id="${place.id}"]`)
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    const marker = markers[place.id]
    if (marker) {
        if (centerMap) {
            if (isMobile.value) {
                const panelBottom = 60 * window.innerHeight / 100
                const visibleCenterY = (panelBottom + window.innerHeight) / 2
                const containerWidth = map.getSize().x
                const targetLatLng = map.containerPointToLatLng([containerWidth / 2, visibleCenterY])
                map.setView(targetLatLng, map.getZoom(), { animate: false })
            } else {
                map.setView([place.lat, place.lng], map.getZoom(), { animate: false })
            }
        }
        setTimeout(() => { if (markers[place.id]) markers[place.id].openPopup() }, 50)
    }
}

const closeDropdowns = () => {
    dropdownVisibility['region'] = false
    dropdownVisibility['type'] = false
    dropdownVisibility['area'] = false
}

const selectRegion = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].region = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex].places[placeIndex].id
    dropdownVisibility[placeId + '_region'] = false
}

const selectType = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].type = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex]?.places[placeIndex]?.id
    dropdownVisibility[placeId + '_type'] = false
}

const selectArea = (value) => {
    if (!selectedPlace.value) return
    const { groupIndex, placeIndex } = selectedPlace.value
    if (groups.value[groupIndex] && groups.value[groupIndex].places[placeIndex]) {
        const now = new Date().toISOString()
        groups.value[groupIndex].places[placeIndex].area = value
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    const placeId = groups.value[groupIndex].places[placeIndex].id
    dropdownVisibility[placeId + '_area'] = false
}

const closeDetail = () => {
    selectedPlace.value = null
    mapPickMode.value = false
    if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null }
}

const enableMapPick = () => {
    mapPickMode.value = !mapPickMode.value
    if (mapPickMode.value) {
        map.getContainer().style.cursor = 'crosshair'
    } else {
        map.getContainer().style.cursor = ''
        if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null }
    }
}

const addPlace = (gi) => {
    const now = new Date().toISOString()
    const newPlace = {
        id: crypto.randomUUID(), name: '', emoji: '📍', lat: 0, lng: 0,
        region: '', type: 'sightseeing', area: '', hours: '', notes: '', ai_notes: '', address: '', links: [],
        created: now, modified: now
    }
    groups.value[gi].places.push(newPlace)
    updateGroupModified(groups.value[gi], now)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
    nextTick(() => selectPlace(gi, groups.value[gi].places.length - 1))
}

const deletePlace = (gi, pi) => {
    if (!confirm(`確定刪除「${groups.value[gi].places[pi].name}」？`)) return
    groups.value[gi].places.splice(pi, 1)
    closeDetail()
    const now = new Date().toISOString()
    updateGroupModified(groups.value[gi], now)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const duplicatePlace = (gi, pi) => {
    const original = groups.value[gi].places[pi]
    const now = new Date().toISOString()
    const clone = {
        ...original,
        id: crypto.randomUUID(),
        name: original.name ? `${original.name} (複製)` : '未命名',
        links: [...(original.links || [])],
        created: now,
        modified: now
    }
    groups.value[gi].places.splice(pi + 1, 0, clone)
    updateGroupModified(groups.value[gi], now)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
    nextTick(() => selectPlace(gi, pi + 1))
}

const addGroup = () => {
    if (!newGroupForm.name.trim()) return
    const now = new Date().toISOString()
    groups.value.push({
        id: crypto.randomUUID(), name: newGroupForm.name.trim(), emoji: newGroupForm.emoji,
        collapsed: false, created: now, modified: now, places: []
    })
    newGroupForm.name = ''
    newGroupForm.emoji = '📌'
    showAddGroupForm.value = false
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const deleteGroup = (gi) => {
    if (groups.value.length <= 1) return
    if (!confirm(`確定刪除群組「${groups.value[gi].name}」？其中的地點將移至第一個群組。`)) return
    const now = new Date().toISOString()
    const group = groups.value.splice(gi, 1)[0]
    if (group.places.length > 0) groups.value[0].places.push(...group.places)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const clearFilter = () => { filter.search = ''; filter.type = null }
const updateFieldType = (event) => {
    const p = currentPlace.value
    if (!p) return
    const now = new Date().toISOString()
    p.type = event.target.value
    p.modified = now
}
const updatePlaceLinks = (place, links) => {
    if (!place) return
    const now = new Date().toISOString()
    place.links = links
    place.modified = now
}

const selectFilteredPlace = (filteredGi, filteredPi) => {
    if (!filteredGroups.value[filteredGi]?.places?.[filteredPi]) return
    const filteredPlace = filteredGroups.value[filteredGi].places[filteredPi]
    let realGi = 0
    for (let i = 0; i < groups.value.length; i++) {
        for (let j = 0; j < groups.value[i].places.length; j++) {
            if (groups.value[i].places[j].id === filteredPlace.id) { realGi = i; break }
        }
    }
    let realPi = 0
    for (let i = 0; i < groups.value[realGi].places.length; i++) {
        if (groups.value[realGi].places[i].id === filteredPlace.id) { realPi = i; break }
    }
    selectPlace(realGi, realPi, true)
}

const openEmojiPicker = (target) => { emojiPickerTarget.value = target; showEmojiPicker.value = true }
const closeEmojiPicker = () => { showEmojiPicker.value = false }
const selectEmoji = (emoji) => {
    if (!emojiPickerTarget.value) return
    const { type, groupIndex, placeIndex } = emojiPickerTarget.value
    const now = new Date().toISOString()
    if (type === 'group') {
        groups.value[groupIndex].emoji = emoji
        groups.value[groupIndex].modified = now
    } else if (type === 'place') {
        groups.value[groupIndex].places[placeIndex].emoji = emoji
        groups.value[groupIndex].places[placeIndex].modified = now
    }
    showEmojiPicker.value = false
}

const onDragStartPlace = (gi, pi, e) => {
    dragState.draggingPlace = { groupIndex: gi, placeIndex: pi }
    dragState.draggingGroup = null
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
}
const onDragOverPlace = (gi, pi, e) => { dragState.overGroup = gi; dragState.overPlaceIndex = pi }
const onDragOverGroupEnd = (gi, e) => { dragState.overGroup = gi; dragState.overPlaceIndex = null }
const onDropOnPlace = (gi, pi, e) => {
    e.preventDefault()
    if (!dragState.draggingPlace) return
    const { groupIndex: fromGi, placeIndex: fromPi } = dragState.draggingPlace
    const now = new Date().toISOString()
    if (fromGi === gi) {
        const place = groups.value[fromGi].places.splice(fromPi, 1)[0]
        groups.value[gi].places.splice(pi, 0, place)
    } else {
        const fromGroup = groups.value[fromGi]
        const toGroup = groups.value[gi]
        const place = fromGroup.places.splice(fromPi, 1)[0]
        toGroup.places.splice(pi, 0, place)
    }
    updateGroupModified(groups.value[gi], now)
    if (fromGi !== gi) updateGroupModified(groups.value[fromGi], now)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
    dragState.draggingPlace = null
    dragState.overGroup = null
    dragState.overPlaceIndex = null
}
const onDragStartGroup = (gi, e) => {
    dragState.draggingGroup = gi
    dragState.draggingPlace = null
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
}
const onDragOverGroup = (gi, e) => {
    if (dragState.draggingGroup === null) return
    dragState.overGroup = gi
    dragState.overPlaceIndex = null
    dragState.dragOverPosition = null
}
const onDropOnGroup = (gi, e) => {
    e.preventDefault()
    const now = new Date().toISOString()
    if (dragState.draggingGroup !== null) {
        const fromGi = dragState.draggingGroup
        if (fromGi !== gi) {
            const group = groups.value.splice(fromGi, 1)[0]
            groups.value.splice(gi, 0, group)
        }
        const plansData = getAllPlans()
        if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
        groups.value.forEach(g => updateGroupModified(g, now))
    } else if (dragState.draggingPlace) {
        const { groupIndex: fromGi, placeIndex: fromPi } = dragState.draggingPlace
        const fromGroup = groups.value[fromGi]
        const toGroup = groups.value[gi]
        const place = fromGroup.places.splice(fromPi, 1)[0]
        toGroup.places.push(place)
        updateGroupModified(toGroup, now)
        if (fromGi !== gi) updateGroupModified(fromGroup, now)
        const plansData = getAllPlans()
        if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
    }
    dragState.draggingGroup = null
    dragState.draggingPlace = null
    dragState.overGroup = null
    dragState.overPlaceIndex = null
    dragState.dragOverPosition = null
}

const doCreatePlan = () => {
    if (!newPlanName.value.trim()) { createPlanError.value = '請輸入行程名稱'; return }
    const defaultData = createDefaultData()
    const planId = createPlanStorage(newPlanName.value.trim(), defaultData.groups)
    currentPlanIdVal.value = planId
    refreshPlanRefs()
    newPlanName.value = ''
    showPlanCreateInput.value = false
    createPlanError.value = ''
    showPlanSelector.value = false
}
const doLoadPlan = (planId) => {
    const newGroups = loadPlanStorage(planId)
    if (newGroups) {
        currentPlanIdVal.value = planId
        groups.value = newGroups
        filter.type = null
        selectedPlace.value = null
        refreshPlanRefs()
        showPlanSelector.value = false
    }
}
const doDeletePlan = (planId) => {
    if (!confirm('確定刪除此行程？')) return
    const plansData = getAllPlans()
    if (Object.keys(plansData.plans).length <= 1) { alert('至少需要保留一個行程'); return }
    if (deletePlanStorage(planId)) {
        currentPlanIdVal.value = plansData.currentPlanId
        groups.value = JSON.parse(JSON.stringify(plansData.plans[plansData.currentPlanId].groups))
        refreshPlanRefs()
    }
}
const handlePlanImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result)
            if (!data.groups || !Array.isArray(data.groups)) { alert('JSON 格式錯誤：缺少 groups 陣列'); return }
            const defaultData = createDefaultData()
            const planId = importPlanStorage(data, defaultData.groups)
            currentPlanIdVal.value = planId
            groups.value = JSON.parse(JSON.stringify(getAllPlans().plans[planId].groups))
            refreshPlanRefs()
            showPlanSelector.value = false
        } catch { alert('JSON 格式錯誤') }
    }
    reader.readAsText(file)
    e.target.value = ''
}
const doRenamePlan = (planId) => {
    if (!editingPlanName.value.trim()) { alert('行程名稱不能為空'); cancelRenamePlan(); return }
    const plansData = getAllPlans()
    if (!plansData || !plansData.plans[planId]) { cancelRenamePlan(); return }
    const newName = editingPlanName.value.trim()
    const duplicate = Object.entries(plansData.plans).find(([id, p]) => id !== planId && p.name === newName)
    if (duplicate) { alert(`已存在同名行程「${newName}」`); cancelRenamePlan(); return }
    plansData.plans[planId].name = newName
    localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
    refreshPlanRefs()
    cancelRenamePlan()
}
const cancelRenamePlan = () => { editingPlanId.value = null; editingPlanName.value = '' }
const handleRenameBlur = (planId) => { if (editingPlanId.value === planId) doRenamePlan(planId) }
const startRenamePlan = (plan) => { editingPlanId.value = plan.id; editingPlanName.value = plan.name }

const initMap = () => {
    const mapEl = document.getElementById('map')
    map = L.map('map', { preferCanvas: false, zoomAnimation: false, markerZoomAnimation: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    map.setView([36.2, 139.3], 9)
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
        if (mapPickMode.value && currentPlace.value) {
            currentPlace.value.lat = e.latlng.lat
            currentPlace.value.lng = e.latlng.lng
            updateMarkers()
            if (pickMarker) map.removeLayer(pickMarker)
            pickMarker = L.marker([e.latlng.lat, e.latlng.lng], {
                icon: L.divIcon({
                    className: 'pick-marker',
                    html: '<div style="background-color: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
                    iconSize: [20, 20], iconAnchor: [10, 10]
                })
            }).addTo(map)
            mapPickMode.value = false
        } else { closeDetail() }
    })
}

const updateMarkers = () => {
    const prevMarkerCount = Object.keys(markers).length
    Object.values(markers).forEach(m => map.removeLayer(m))
    markers = {}
    if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null }
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
                <span class="region-badge" style="background-color: ${getGroupColor(gi)}">${getRegionName(place.region)}</span>
                <span class="type-badge" style="background-color: ${typeInfo.color}">${typeInfo.name}</span>
                ${place.hours ? `<p style="margin-top: 6px; font-size: 12px;">🕐 ${place.hours}</p>` : ''}
                <a href="${buildMapsLink(place)}" target="_blank" class="popup-link">📍 Google Maps</a>
            `)
            marker.on('click', () => { selectPlace(gi, pi, false); marker.openPopup() })
            markers[place.id] = marker
        })
    })
    const newMarkerCount = Object.keys(markers).length
    if (prevMarkerCount !== newMarkerCount) {
        const nonNullMarkers = Object.values(markers)
        if (nonNullMarkers.length > 0) {
            const group = L.featureGroup(nonNullMarkers)
            map.fitBounds(group.getBounds().pad(0.1))
        }
    }
}

watch(groups, () => {
    nextTick(() => updateMarkers())
    const now = new Date().toISOString()
    groups.value.forEach(g => {
        g.places.forEach(p => { if (p && p.modified !== undefined) p.modified = now })
    })
    const plansData = getAllPlans()
    if (plansData) saveToLocalStorage(plansData, currentPlanIdVal.value, groups.value)
}, { deep: true })

let hasInteracted = false
let initialSnapshot = ''
function getDirtyState() {
    const plansData = getAllPlans()
    if (!plansData) return ''
    const current = plansData.plans[plansData.currentPlanId]
    if (!current) return ''
    return JSON.stringify({ groups: current.groups, _meta: current._meta })
}

onMounted(() => {
    checkMobile()
    const loaded = loadFromLocalStorage()
    if (loaded && loaded.groups) {
        groups.value = loaded.groups
    } else {
        const defaultData = createDefaultData()
        const planId = createPlanStorage('預設行程', defaultData.groups)
        currentPlanIdVal.value = planId
        groups.value = JSON.parse(JSON.stringify(defaultData.groups))
    }
    if (!currentPlanIdVal.value) {
        const plansData = getAllPlans()
        currentPlanIdVal.value = plansData.currentPlanId
    }
    refreshPlanRefs()
    initialSnapshot = getDirtyState()
    initMap()
    setTimeout(() => { map.invalidateSize() }, 200)
    setTimeout(() => { map.invalidateSize() }, 1000)
    setTimeout(() => { updateMarkers() }, 200)
    document.addEventListener('click', () => { hasInteracted = true }, { once: true })
    window.addEventListener('resize', checkMobile)
    window.addEventListener('beforeunload', (e) => {
        if (hasInteracted && getDirtyState() !== initialSnapshot) {
            e.preventDefault()
            e.returnValue = ''
        }
    })
})

onUnmounted(() => { window.removeEventListener('resize', checkMobile) })
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; height: 100vh; overflow: hidden; }
#app { display: flex; height: 100%; position: relative; }
#main-content { padding-top: 52px; flex: 1; display: flex; overflow: hidden; position: relative; }
.top-header { position: fixed; top: 0; left: 0; right: 0; height: 52px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; padding: 0 12px; z-index: 1005; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.top-header .hamburger-icon { background: none; border: none; color: white; font-size: 22px; cursor: pointer; padding: 8px; margin-right: 8px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
.top-header .app-title { font-size: 16px; font-weight: 600; flex: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-header .plan-name { font-size: 12px; opacity: 0.8; margin-left: 8px; white-space: nowrap; }
.top-header .plan-switch-btn { background: none; border: 1px solid rgba(255,255,255,0.3); color: white; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px; margin-left: 8px; transition: background 0.2s; }
.top-header .plan-switch-btn:hover { background: rgba(255,255,255,0.2); }
#sidebar { width: 400px; background: #f8f9fa; border-right: 1px solid #dee2e6; overflow-y: auto; display: flex; flex-direction: column; position: relative; z-index: 10; }
#sidebar-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
#sidebar-header h1 { font-size: 18px; margin-bottom: 8px; }
.header-actions { display: flex; gap: 8px; }
.header-actions button { flex: 1; padding: 8px 12px; border: none; border-radius: 6px; background: rgba(255,255,255,0.2); color: white; cursor: pointer; font-size: 13px; transition: background 0.2s; }
.header-actions button:hover { background: rgba(255,255,255,0.3); }
.search-filter { padding: 12px 16px; background: white; border-bottom: 1px solid #dee2e6; }
.search-filter input { width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; outline: none; }
.search-filter input:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.2); }
.stat-card { flex: 1; padding: 8px; border-radius: 8px; text-align: center; background: #f8f9fa; }
.stat-card .number { font-size: 18px; font-weight: bold; color: #333; }
.stat-card .label { font-size: 10px; color: #666; margin-top: 2px; }
.legend { padding: 12px 16px; background: white; border-bottom: 1px solid #dee2e6; }
.legend h3 { font-size: 12px; color: #666; margin-bottom: 8px; }
.legend-items { display: flex; flex-wrap: wrap; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #666; }
.legend-item.active { font-weight: 600; color: #333; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
#places-list { flex: 1; overflow-y: auto; padding: 8px; }
.region-group { margin-bottom: 8px; border: 1px solid #dee2e6; border-radius: 8px; background: white; transition: box-shadow 0.2s; }
.region-group.drag-over { box-shadow: 0 0 0 2px #667eea; }
.region-group h2 { font-size: 13px; margin: 0; padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: background 0.2s; }
.region-group h2:hover { background: rgba(0,0,0,0.03); }
.region-group h2 .group-name { display: flex; align-items: center; gap: 6px; }
.delete-group-btn { background: none; border: none; color: #999; cursor: pointer; font-size: 14px; padding: 0 4px; border-radius: 4px; }
.delete-group-btn:hover { color: #e74c3c; background: #fee; }
.region-content { padding: 4px 8px 8px; }
.place-item { padding: 8px 10px; margin: 3px 0; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s; border-left: 4px solid; position: relative; }
.place-item:hover { transform: translateX(3px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
.place-item.selected { box-shadow: 0 0 0 2px rgba(102,126,234,0.4); background: #f0f4ff; }
.place-item.drag-over { border-top: 3px solid #667eea; margin-top: -1px; }
.place-placeholder { height: 4px; background: #667eea; margin: 3px 0; border-radius: 2px; }
.place-item .name { font-weight: 500; font-size: 13px; margin-bottom: 2px; }
.place-item .region { font-size: 10px; color: #666; }
.place-item .type-badge { display: inline-block; padding: 1px 5px; border-radius: 8px; font-size: 9px; color: white; margin-left: 4px; vertical-align: middle; }
.place-item .no-coords-badge { display: inline-block; margin-left: 4px; vertical-align: middle; font-size: 10px; cursor: help; }
.add-place-btn { width: 100%; padding: 8px; border: 1px dashed #ccc; border-radius: 6px; background: none; color: #667eea; cursor: pointer; font-size: 12px; margin-top: 4px; }
.add-place-btn:hover { background: #f0f4ff; border-color: #667eea; }
.add-group-section { padding: 8px 16px; border-top: 1px solid #dee2e6; background: white; }
.add-group-section button { width: 100%; padding: 8px; border: 1px dashed #ccc; border-radius: 6px; background: none; color: #667eea; cursor: pointer; font-size: 12px; }
.add-group-section button:hover { background: #f0f4ff; }
.add-group-form { display: flex; gap: 4px; }
.add-group-form input { flex: 1; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 12px; }
.add-group-form button { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
#detail-panel { position: absolute; top: 52px; left: 0; width: 320px; height: calc(100% - 52px); background: white; box-shadow: -2px 0 8px rgba(0,0,0,0.1); z-index: 1005; transform: translateX(-100%); transition: transform 0.3s ease; overflow: hidden; pointer-events: none; }
#detail-panel.expanded { transform: translateX(400px); pointer-events: auto; }
.detail-content { padding: 16px; overflow-y: auto; -webkit-overflow-scrolling: touch; height: 100%; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.detail-title { font-size: 16px; font-weight: bold; color: #333; }
.detail-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 4px; }
.detail-close:hover { color: #333; }
.form-row { display: flex; gap: 8px; margin-bottom: 10px; }
.form-field { flex: 1; margin-bottom: 10px; }
.form-field label { display: block; font-size: 11px; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
.form-field input, .form-field select, .form-field textarea { width: 100%; padding: 7px 10px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; outline: none; font-family: inherit; }
.form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
.form-field textarea { resize: vertical; min-height: 40px; }
.emoji-field { display: flex; gap: 4px; align-items: center; }
.emoji-field input { width: 36px; height: 36px; border: 1px solid #dee2e6; border-radius: 6px; background: white; font-size: 18px; text-align: center; outline: none; }
.emoji-field input:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
.emoji-field button { width: 36px; height: 36px; border: 1px solid #dee2e6; border-radius: 6px; background: white; font-size: 18px; cursor: pointer; }
.emoji-field button:hover { background: #f0f4ff; }
.smart-input { position: relative; }
.smart-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #dee2e6; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 100; max-height: 150px; overflow-y: auto; }
.smart-dropdown div { padding: 6px 10px; font-size: 12px; cursor: pointer; transition: background 0.15s; }
.smart-dropdown div:hover { background: #f0f4ff; }
.link-row { display: flex; gap: 4px; margin-bottom: 4px; }
.link-row input { flex: 1; }
.link-row button { padding: 6px 8px; border: 1px solid #e74c3c; border-radius: 6px; background: #fee; color: #e74c3c; cursor: pointer; font-size: 12px; }
.add-link-btn { padding: 6px 10px; border: 1px dashed #ccc; border-radius: 6px; background: none; color: #667eea; cursor: pointer; font-size: 11px; }
.add-link-btn:hover { background: #f0f4ff; }
.form-actions { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.save-status { font-size: 11px; color: #27ae60; }
.duplicate-place-btn { margin-left: auto; padding: 6px 12px; border: 1px solid #27ae60; border-radius: 6px; background: #efe; color: #27ae60; cursor: pointer; font-size: 12px; }
.duplicate-place-btn:hover { background: #27ae60; color: white; }
.delete-place-btn { padding: 6px 12px; border: 1px solid #e74c3c; border-radius: 6px; background: #fee; color: #e74c3c; cursor: pointer; font-size: 12px; }
.delete-place-btn:hover { background: #e74c3c; color: white; }
.detail-link { display: inline-block; padding: 8px 14px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; transition: background 0.2s; }
.detail-link:hover { background: #5568d3; }
#map { flex: 1; height: 100%; position: relative; z-index: 1; }
#map .leaflet-tile-container { width: 100%; height: 100%; }
.leaflet-popup-content { margin: 8px; font-size: 13px; }
.leaflet-popup-content h3 { margin: 0 0 4px 0; font-size: 14px; }
.leaflet-popup-content .region-badge, .leaflet-popup-content .type-badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 10px; color: white; margin-right: 4px; }
.leaflet-popup-content .popup-link { display: inline-block; margin-top: 6px; padding: 4px 10px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; }
.emoji-picker-panel { position: absolute; top: 0; left: 720px; width: 300px; height: 100%; background: white; box-shadow: -4px 0 16px rgba(0,0,0,0.15); z-index: 1002; transform: translateX(100%); transition: transform 0.3s ease; overflow: hidden; pointer-events: none; visibility: hidden; opacity: 0; }
.emoji-picker-panel.expanded { transform: translateX(0); pointer-events: auto; visibility: visible; opacity: 1; }
.emoji-picker-content { padding: 12px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.emoji-picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #dee2e6; flex-shrink: 0; }
.emoji-picker-header h4 { font-size: 13px; color: #666; margin: 0; }
.emoji-picker-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #999; padding: 4px 8px; }
.emoji-picker-close:hover { color: #333; }
.emoji-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; overflow-y: auto; flex: 1; min-height: 0; padding-bottom: 12px; }
.emoji-grid button { font-size: 18px; background: none; border: none; cursor: pointer; padding: 2px; border-radius: 4px; transition: background 0.15s; min-width: 0; height: 28px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; flex-shrink: 0; }
.no-results { text-align: center; padding: 30px 20px; color: #999; font-size: 13px; }
.plan-selector-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 1006; }
.plan-selector-panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; background: white; box-shadow: -4px 0 16px rgba(0,0,0,0.15); z-index: 1007; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
.plan-selector-panel.open { transform: translateX(0); }
.plan-selector-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center; }
.plan-selector-header h3 { margin: 0; font-size: 16px; }
.plan-selector-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.plan-selector-body { flex: 1; overflow-y: auto; padding: 12px; }
.plan-list-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; }
.plan-list-item.active { border-color: #667eea; background: #f0f4ff; }
.plan-list-item:not(.active):hover { background: #f8f9fa; }
.plan-info { display: flex; flex-direction: column; gap: 2px; }
.plan-info-name { font-weight: 600; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plan-info-meta { font-size: 11px; color: #999; }
.plan-actions { display: flex; gap: 4px; justify-content: flex-end; }
.plan-actions button { padding: 6px 10px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }
.plan-load-btn { background: #667eea; color: white; }
.plan-load-btn:hover { background: #5568d3; }
.plan-delete-btn { background: #fee; color: #e74c3c; }
.plan-delete-btn:hover { background: #e74c3c; color: white; }
.plan-download-btn { background: #f0f4ff; color: #667eea; }
.plan-download-btn:hover { background: #667eea; color: white; }
.plan-rename-btn { background: #fff3cd; color: #856404; }
.plan-rename-btn:hover { background: #856404; color: white; }
.plan-list-empty { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
.plan-selector-actions { padding: 12px; border-top: 1px solid #dee2e6; }
.plan-selector-actions button { width: 100%; padding: 10px; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 6px; }
.plan-create-btn { background: #27ae60; color: white; }
.plan-create-btn:hover { background: #219a52; }
.plan-import-btn { background: #667eea; color: white; }
.plan-import-btn:hover { background: #5568d3; }
.plan-create-input-row { display: flex; gap: 6px; padding: 8px 12px; }
.plan-create-input-row input { flex: 1; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; }
.plan-create-input-row button { padding: 8px 16px; border: none; border-radius: 6px; background: #27ae60; color: white; font-size: 13px; cursor: pointer; }
.plan-error-msg { color: #e74c3c; font-size: 12px; padding: 0 12px 8px; }
@media (max-width: 768px) {
    body { flex-direction: column; }
    #app { flex-direction: column; height: 100vh; overflow: hidden; position: relative; }
    #main-content { padding-top: 0; }
    #sidebar { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 999; transform: translateX(-100%); transition: transform 0.3s ease; border-right: none; }
    #sidebar:not(.mobile-open) { transform: translateX(-100%); }
    #sidebar.mobile-open { transform: translateX(0); }
    #map { flex: 1; height: calc(100vh - 52px); width: 100%; z-index: 1; }
    #map.pick-mode { z-index: 1003; }
    #detail-panel.expanded + #map.pick-mode { opacity: 0.7; z-index: 1002; }
    #detail-panel { position: fixed; top: 52px; left: 0; width: 100%; height: calc(60vh - 52px); max-height: calc(60vh - 52px); z-index: 1001; transform: translateY(-100%); transition: transform 0.3s ease; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); pointer-events: none; }
    #detail-panel.expanded { transform: translateY(0); pointer-events: auto; }
    #detail-panel.mobile-hidden { transform: translateY(-100%) !important; pointer-events: none !important; }
    #map { z-index: 1; }
    .emoji-picker-panel { left: 0; width: 100%; top: calc(60vh + 52px); transform: translateY(100%); z-index: 1002; border-radius: 16px 16px 0 0; }
    .emoji-picker-panel.expanded { transform: translateY(0); }
    .plan-selector-panel { width: 100%; }
    .stat-card .number { font-size: 16px; }
    .stat-card .label { font-size: 9px; }
    .header-actions button { font-size: 13px; padding: 8px 10px; }
    .search-filter input { font-size: 16px; padding: 12px 14px; }
    .place-item { padding: 12px 14px; }
    .place-item .name { font-size: 14px; }
}
</style>
