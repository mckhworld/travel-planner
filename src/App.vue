<template>
    <div class="top-header">
        <button class="hamburger-icon" @click="toggleMobileSidebar">☰</button>
        <span class="app-title">🗾 旅行地圖</span>
        <span class="plan-name" v-if="currentPlanNameRef">· {{ currentPlanNameRef }}</span>
        <button class="plan-switch-btn" @click="showPlanSelector = !showPlanSelector">📋</button>
        <button class="plan-switch-btn" @click="openSettings">⚙️</button>
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
                            <button class="edit-group-btn" @click.stop="openGroupEditor()" title="編輯群組">✏️</button>
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
                <button @click="openGroupEditor()">+ 新增群組</button>
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
                        <button v-if="drive.isAuthenticated" class="plan-drive-export-btn" @click.stop="openDriveExportForPlan(plan)" title="匯出到 Google Drive">☁️ 匯出(Google Drive)</button>
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
                <template v-if="drive.isAuthenticated">
                    <button class="plan-drive-import-btn" @click="openDriveFileBrowser">☁️ 從 Google Drive 匯入</button>
                </template>
            </div>
        </div>

        <div class="settings-overlay" v-if="showSettingsPanel" @click="showSettingsPanel = false"></div>
        <div class="settings-panel" :class="{ open: showSettingsPanel }">
            <div class="settings-header">
                <h3>⚙️ 設定</h3>
                <button class="settings-close" @click="showSettingsPanel = false">✕</button>
            </div>
            <div class="settings-body">
                <div class="settings-section">
                    <h4>Google Drive</h4>
                    <template v-if="drive.isAuthenticated && drive.userProfile">
                        <div class="drive-user-info">
                            <img v-if="drive.userProfile.picture" :src="drive.userProfile.picture" class="drive-user-avatar" alt="avatar" />
                            <div class="drive-user-details">
                                <div class="drive-user-name">{{ drive.userProfile.name }}</div>
                                <div class="drive-user-email">{{ drive.userProfile.email }}</div>
                            </div>
                        </div>
                        <button class="drive-logout-btn" @click="drive.logout()">登出 Google Drive</button>

                        <div class="drive-folder-section">
                            <h4>行程資料夾</h4>
                            <p class="drive-folder-desc">匯入/匯出的行程檔案會存放在此資料夾</p>
                            <div v-if="driveFolderList.length === 0 && !drive.isLoading" class="drive-folder-empty">
                                尚未建立資料夾，請点击下方按鈕建立
                            </div>
                            <div v-if="drive.isLoading" class="drive-loading">載入中...</div>
                            <div v-else-if="driveFolderList.length > 0" class="drive-folder-list">
                                <div v-for="folder in driveFolderList" :key="folder.id"
                                     class="drive-folder-item"
                                     :class="{ selected: drive.selectedFolderId === folder.id }"
                                     @click="drive.selectFolder(folder.id)">
                                    <div class="drive-folder-name">📁 {{ folder.name }}</div>
                                </div>
                            </div>
                            <div class="drive-folder-actions">
                                <button class="drive-create-folder-btn" @click="showCreateFolderInput = true" :disabled="drive.isLoading">
                                    ➕ 建立資料夾
                                </button>
                                <button v-if="!drive.selectedFolderId" class="drive-init-folder-btn" @click="initDefaultFolder" :disabled="drive.isLoading">
                                    🚀 初始化預設資料夾
                                </button>
                            </div>
                            <div v-if="showCreateFolderInput" class="drive-create-folder-input">
                                <input v-model="newFolderName" placeholder="資料夾名稱" @keyup.enter="handleCreateFolder" />
                                <button @click="handleCreateFolder" :disabled="!newFolderName.trim()">建立</button>
                                <button @click="showCreateFolderInput = false" style="background:#fee;color:#e74c3c;">取消</button>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <p class="drive-disconnect-msg">未連接 Google Drive</p>
                        <button class="drive-login-btn" @click="handleDriveLogin" :disabled="drive.isLoading">
                            {{ drive.isLoading ? '登入中...' : '連接 Google Drive' }}
                        </button>
                    </template>
                    <div v-if="drive.loginError" class="drive-error-msg">{{ drive.loginError }}</div>
                </div>
            </div>
        </div>

        <div class="drive-file-browser-overlay" v-if="showDriveFileBrowser" @click="closeDriveFileBrowser">
            <div class="drive-file-browser" @click.stop>
                <div class="drive-file-browser-header">
                    <h4>從 Google Drive 匯入行程</h4>
                    <button class="drive-file-browser-close" @click="closeDriveFileBrowser">✕</button>
                </div>
                <div class="drive-file-browser-body">
                    <div v-if="drive.isLoading" class="drive-loading">載入檔案列表中...</div>
                    <div v-else-if="driveFileList.length === 0" class="drive-empty">Google Drive 中沒有找到 JSON 檔案</div>
                    <div v-else class="drive-file-list">
                        <div v-for="file in driveFileList" :key="file.id"
                             class="drive-file-item"
                             :class="{ selected: selectedDriveFile?.id === file.id }"
                             @click="selectedDriveFile = file">
                            <div class="drive-file-info">
                                <div class="drive-file-name">📄 {{ file.name }}</div>
                                <div class="drive-file-meta">{{ formatFileSize(file.size) }} · {{ formatDate(file.modifiedTime) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="drive-file-browser-footer">
                    <button class="drive-cancel-btn" @click="closeDriveFileBrowser">取消</button>
                    <button class="drive-import-btn" @click="confirmDriveImport" :disabled="!selectedDriveFile || drive.isLoading">
                        {{ drive.isLoading ? '匯入中...' : '匯入' }}
                    </button>
                </div>
            </div>
        </div>

        <div class="drive-export-overlay" v-if="showDriveExportDialog" @click="closeDriveExportDialog">
            <div class="drive-export-dialog" @click.stop>
                <div class="drive-export-header">
                    <h4>☁️ 匯出到 Google Drive</h4>
                    <button class="drive-export-close" @click="closeDriveExportDialog">✕</button>
                </div>
                <div class="drive-export-body">
                    <div class="form-field">
                        <label>檔案名稱</label>
                        <input v-model="driveExportFilename" placeholder="行程名稱.json" />
                    </div>
                    <div v-if="driveExportExistingFiles.length > 0" class="drive-existing-files">
                        <p class="drive-existing-title">現有同名檔案（可選擇覆蓋）：</p>
                        <div v-for="file in driveExportExistingFiles" :key="file.id"
                             class="drive-file-item"
                             :class="{ selected: selectedOverwriteFile?.id === file.id }"
                             @click="selectedOverwriteFile = file">
                            <div class="drive-file-info">
                                <div class="drive-file-name">📄 {{ file.name }}</div>
                                <div class="drive-file-meta">{{ formatFileSize(file.size) }} · {{ formatDate(file.modifiedTime) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="drive-export-footer">
                    <button class="drive-cancel-btn" @click="closeDriveExportDialog">取消</button>
                    <button v-if="selectedOverwriteFile" class="drive-overwrite-btn" @click="confirmDriveOverwrite" :disabled="drive.isLoading">
                        {{ drive.isLoading ? '覆蓋中...' : '覆蓋檔案' }}
                    </button>
                    <button class="drive-upload-btn" @click="doDriveUpload" :disabled="!driveExportFilename.trim() || drive.isLoading">
                        {{ drive.isLoading ? '上傳中...' : '上傳新檔案' }}
                    </button>
                </div>
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

        <div class="group-editor-overlay" v-if="showGroupEditor" @click="closeGroupEditor"></div>
        <div class="group-editor-panel" :class="{ open: showGroupEditor }">
            <div class="group-editor-header">
                <h3>📋 群組管理</h3>
                <button class="group-editor-close" @click="closeGroupEditor">✕</button>
            </div>
            <div class="group-editor-body">
                <div v-for="(group, gi) in groups" :key="group.id"
                     class="group-editor-item"
                     :class="{ 'drag-over': groupEditorDragState.overIndex === gi, 'dragging': groupEditorDragState.draggingIndex === gi }"
                     @dragover.prevent="onDragOverGroupEdit(gi, $event)"
                     @drop="onDropGroupEdit(gi, $event)">
                    <div class="group-editor-drag-handle"
                         :draggable="editingGroupId !== group.id"
                         @dragstart="onDragStartGroupEdit(gi, $event)">☰</div>
                    <div class="emoji-field" style="flex-shrink: 0;">
                        <input :value="group.emoji" @input="group.emoji = $event.target.value" placeholder="📌" />
                        <button @click="openEmojiPicker({ type: 'group', groupIndex: gi })">🎨</button>
                    </div>
                    <div class="group-editor-name">
                        <template v-if="editingGroupId === group.id">
                            <input :value="editingGroupName" @keyup.enter="doRenameGroup(gi)" @blur="cancelRenameGroup" @keyup.escape="cancelRenameGroup" @input="editingGroupName = $event.target.value" style="font-weight:600;font-size:14px;color:#333;border:2px solid #667eea;border-radius:4px;padding:2px 6px;outline:none;width:100%;" />
                        </template>
                        <div v-else class="group-editor-name-text">{{ group.name }} ({{ group.places.length }})</div>
                    </div>
                    <div class="group-editor-actions">
                        <button class="group-editor-rename-btn" @click.stop="startRenameGroup(gi)" title="重新命名">✏️</button>
                        <button class="group-editor-move-btn" @click.stop="moveGroupUp(gi)" :disabled="gi === 0" title="上移">↑</button>
                        <button class="group-editor-move-btn" @click.stop="moveGroupDown(gi)" :disabled="gi === groups.length - 1" title="下移">↓</button>
                        <button class="group-editor-delete-btn" @click.stop="deleteGroupFromEditor(gi)" v-if="groups.length > 1" title="刪除群組">✕</button>
                    </div>
                </div>
                <div class="group-editor-empty" v-if="groups.length === 0">
                    尚無群組
                </div>
            </div>
            <div class="group-editor-footer">
                <div class="group-editor-add-form">
                    <input v-model="newGroupForm.name" placeholder="群組名稱" @keyup.enter="addGroupFromEditor" />
                    <div class="emoji-field">
                        <input :value="newGroupForm.emoji" @input="newGroupForm.emoji = $event.target.value" placeholder="📌" />
                        <button @click="openEmojiPicker({ type: 'group', groupIndex: groups.length })">🎨</button>
                    </div>
                    <button class="group-editor-add-btn" @click="addGroupFromEditor">✓ 新增</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import MapLibre from 'maplibre-gl'
import { PLACE_TYPES, REGION_NAMES, COMMON_EMOJIS, REGION_COLOR_PALETTE } from './data/constants.js'
import { createDefaultData } from './data/default-data.js'
import { getRegionName, buildMapsLink, formatDate, updateGroupModified, updatePlanModified } from './utils/helpers.js'
import {
    getAllPlans, saveToLocalStorage, loadFromLocalStorage,
    createPlan as createPlanStorage, deletePlan as deletePlanStorage,
    importPlan as importPlanStorage, loadPlan as loadPlanStorage,
    downloadPlanData
} from './utils/storage.js'
import { validatePlanJson } from './utils/validatePlanJson.js'
import { useGoogleDrive } from './composables/useGoogleDrive.js'

const groups = ref([])
const selectedPlace = ref(null)
const dropdownVisibility = reactive({})
const filter = reactive({ search: '', region: null, type: null })
const showEmojiPicker = ref(false)
const emojiPickerTarget = ref(null)
const newGroupForm = reactive({ name: '', emoji: '📌' })
const showGroupEditor = ref(false)
const editingGroupId = ref(null)
const editingGroupName = ref('')
const dragState = reactive({ draggingPlace: null, draggingGroup: null, overGroup: null, overPlaceIndex: null, dragOverPosition: null })
const groupEditorDragState = reactive({ draggingIndex: null, overIndex: null })
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

const drive = useGoogleDrive({
    onAuthSuccess: async () => {
        await loadDriveFolders()
    }
})
const showSettingsPanel = ref(false)
const showDriveFileBrowser = ref(false)
const showDriveExportDialog = ref(false)
const driveFileList = ref([])
const selectedDriveFile = ref(null)
const driveFolderList = ref([])
const showCreateFolderInput = ref(false)
const newFolderName = ref('')
const exportPlanRef = ref(null)
const driveExportFilename = ref('')
const driveExportExistingFiles = ref([])
const selectedOverwriteFile = ref(null)

let map: MapLibre.Map | null = null
let popup: MapLibre.Popup | null = null
let pickMarker: MapLibre.Marker | null = null

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
    if (centerMap && map && place.lat && place.lng) {
        map.jumpTo({ center: [place.lng, place.lat], zoom: map.getZoom() })
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
    if (popup) { popup.remove(); popup = null }
    if (pickMarker) { pickMarker.remove(); pickMarker = null }
}

const enableMapPick = () => {
    mapPickMode.value = !mapPickMode.value
    if (mapPickMode.value && map) {
        map.getCanvas().style.cursor = 'crosshair'
    } else {
        if (map) map.getCanvas().style.cursor = ''
        if (pickMarker) { pickMarker.remove(); pickMarker = null }
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

const deleteGroup = (gi) => {
    if (groups.value.length <= 1) return
    const targetIndex = gi > 0 ? gi - 1 : 1
    const targetName = groups.value[targetIndex]?.name || '第一個群組'
    if (!confirm(`確定刪除群組「${groups.value[gi].name}」？其中的地點將移至「${targetName}」。`)) return
    const now = new Date().toISOString()
    const group = groups.value.splice(gi, 1)[0]
    if (group.places.length > 0) groups.value[targetIndex].places.push(...group.places)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const deleteGroupFromEditor = (gi) => {
    if (groups.value.length <= 1) return
    const targetIndex = gi > 0 ? gi - 1 : 1
    const targetName = groups.value[targetIndex]?.name || '第一個群組'
    if (!confirm(`確定刪除群組「${groups.value[gi].name}」？其中的地點將移至「${targetName}」。`)) return
    const now = new Date().toISOString()
    const group = groups.value.splice(gi, 1)[0]
    if (group.places.length > 0) groups.value[targetIndex].places.push(...group.places)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const addGroupFromEditor = () => {
    if (!newGroupForm.name.trim()) return
    const now = new Date().toISOString()
    groups.value.push({
        id: crypto.randomUUID(), name: newGroupForm.name.trim(), emoji: newGroupForm.emoji,
        collapsed: false, created: now, modified: now, places: []
    })
    newGroupForm.name = ''
    newGroupForm.emoji = '📌'
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const openGroupEditor = () => {
    showGroupEditor.value = true
    cancelRenameGroup()
}

const closeGroupEditor = () => {
    showGroupEditor.value = false
    cancelRenameGroup()
}

const startRenameGroup = (gi) => {
    editingGroupId.value = groups.value[gi].id
    editingGroupName.value = groups.value[gi].name
}

const doRenameGroup = (gi) => {
    if (!editingGroupName.value.trim()) { alert('群組名稱不能為空'); cancelRenameGroup(); return }
    const group = groups.value[gi]
    if (!group) { cancelRenameGroup(); return }
    group.name = editingGroupName.value.trim()
    group.modified = new Date().toISOString()
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, group.modified)
    cancelRenameGroup()
}

const cancelRenameGroup = () => { editingGroupId.value = null; editingGroupName.value = '' }

const moveGroupUp = (gi) => {
    if (gi === 0) return
    const now = new Date().toISOString()
    ;[groups.value[gi], groups.value[gi - 1]] = [groups.value[gi - 1], groups.value[gi]]
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const moveGroupDown = (gi) => {
    if (gi === groups.value.length - 1) return
    const now = new Date().toISOString()
    ;[groups.value[gi], groups.value[gi + 1]] = [groups.value[gi + 1], groups.value[gi]]
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
}

const onDragStartGroupEdit = (gi, e) => {
    groupEditorDragState.draggingIndex = gi
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
    const item = e.target.closest('.group-editor-item')
    if (item) {
        e.dataTransfer.setDragImage(item, e.offsetX, e.offsetY)
    }
}

const onDragOverGroupEdit = (gi, e) => {
    groupEditorDragState.overIndex = gi
}

const onDropGroupEdit = (gi, e) => {
    e.preventDefault()
    const fromGi = groupEditorDragState.draggingIndex
    if (fromGi === null || fromGi === gi) {
        groupEditorDragState.draggingIndex = null
        groupEditorDragState.overIndex = null
        return
    }
    const now = new Date().toISOString()
    const group = groups.value.splice(fromGi, 1)[0]
    groups.value.splice(gi, 0, group)
    const plansData = getAllPlans()
    if (plansData) updatePlanModified(plansData, currentPlanIdVal.value, now)
    groupEditorDragState.draggingIndex = null
    groupEditorDragState.overIndex = null
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
            const validation = validatePlanJson(data)
            if (!validation.valid) { alert(validation.error); return }
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

const openSettings = async () => {
    showSettingsPanel.value = true
    if (drive.isAuthenticated) {
        await loadDriveFolders()
    }
}

const handleDriveLogin = () => {
    drive.login()
}

const initDefaultFolder = async () => {
    try {
        const folder = await drive.ensureDefaultFolder()
        drive.selectFolder(folder.id)
        await loadDriveFolders()
    } catch (err) {
        alert(err.message)
    }
}

const loadDriveFolders = async () => {
    if (!drive.isAuthenticated) return
    try {
        driveFolderList.value = await drive.listFolders()
    } catch {
        driveFolderList.value = []
    }
}

const handleCreateFolder = async () => {
    if (!newFolderName.value.trim()) return
    try {
        const folder = await drive.createFolder(newFolderName.value.trim())
        drive.selectFolder(folder.id)
        showCreateFolderInput.value = false
        newFolderName.value = ''
        await loadDriveFolders()
    } catch (err) {
        alert(err.message)
    }
}

const openDriveFileBrowser = async () => {
    showDriveFileBrowser.value = true
    selectedDriveFile.value = null
    try {
        driveFileList.value = await drive.listJsonFiles()
    } catch (err) {
        alert(err.message)
        closeDriveFileBrowser()
    }
}

const closeDriveFileBrowser = () => {
    showDriveFileBrowser.value = false
    selectedDriveFile.value = null
}

const confirmDriveImport = async () => {
    if (!selectedDriveFile.value) return
    try {
        const data = await drive.downloadFile(selectedDriveFile.value.id)
        const validation = validatePlanJson(data)
        if (!validation.valid) {
            alert(`JSON 驗證失敗：${validation.error}`)
            return
        }
        const defaultData = createDefaultData()
        const planId = importPlanStorage(data, defaultData.groups)
        currentPlanIdVal.value = planId
        groups.value = JSON.parse(JSON.stringify(getAllPlans().plans[planId].groups))
        refreshPlanRefs()
        closeDriveFileBrowser()
        showPlanSelector.value = false
    } catch (err) {
        alert(err.message)
    }
}

const openDriveExportForPlan = async (plan) => {
    exportPlanRef.value = plan
    driveExportFilename.value = `${plan.name}-${new Date().toISOString().slice(0, 10)}.json`
    selectedOverwriteFile.value = null
    await loadExistingFilesForExport(plan.name)
    showDriveExportDialog.value = true
}

const loadExistingFilesForExport = async (planName) => {
    try {
        const files = await drive.listJsonFiles()
        driveExportExistingFiles.value = files.filter(f => f.name.startsWith(planName))
    } catch {
        driveExportExistingFiles.value = []
    }
}

const closeDriveExportDialog = () => {
    showDriveExportDialog.value = false
    exportPlanRef.value = null
    selectedOverwriteFile.value = null
}

const doDriveUpload = async () => {
    if (!exportPlanRef.value || !driveExportFilename.value.trim()) return
    const plansData = getAllPlans()
    const planData = {
        id: exportPlanRef.value.id,
        name: exportPlanRef.value.name,
        groups: JSON.parse(JSON.stringify(exportPlanRef.value.groups)),
        _meta: {
            version: '1.0',
            created: exportPlanRef.value._meta?.created,
            modified: exportPlanRef.value._meta?.modified,
            lastSaved: new Date().toISOString(),
            planName: exportPlanRef.value.name
        }
    }
    try {
        await drive.uploadFile(driveExportFilename.value.trim(), planData)
        alert('匯出成功！')
        closeDriveExportDialog()
    } catch (err) {
        alert(err.message)
    }
}

const confirmDriveOverwrite = async () => {
    if (!selectedOverwriteFile.value || !exportPlanRef.value) return
    if (!confirm(`確定要覆蓋「${selectedOverwriteFile.value.name}」嗎？`)) return
    const plansData = getAllPlans()
    const planData = {
        id: exportPlanRef.value.id,
        name: exportPlanRef.value.name,
        groups: JSON.parse(JSON.stringify(exportPlanRef.value.groups)),
        _meta: {
            version: '1.0',
            created: exportPlanRef.value._meta?.created,
            modified: exportPlanRef.value._meta?.modified,
            lastSaved: new Date().toISOString(),
            planName: exportPlanRef.value.name
        }
    }
    try {
        await drive.overwriteFile(selectedOverwriteFile.value.id, planData)
        alert('覆蓋成功！')
        closeDriveExportDialog()
    } catch (err) {
        alert(err.message)
    }
}

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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
    map = new MapLibre.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [139.3, 36.2],  // [lng, lat]
        zoom: 9,
        attributionControl: true
    })

    // Load custom emoji sprite
    map.setSprite('sprite')  // resolves to /sprite.json from Vite public/

    map.addControl(new MapLibre.AttributionControl({ compact: true }))

    map.on('load', () => {
        // Add GeoJSON source for markers
        if (!map.getSource('markers')) {
            map.addSource('markers', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            })
        }

        // Circle layer (colored dot background)
        map.addLayer({
            id: 'marker-circles',
            type: 'circle',
            source: 'markers',
            paint: {
                'circle-radius': 16,
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-blur': 0
            }
        })

        // Icon layer (emoji sprite overlay)
        map.addLayer({
            id: 'marker-icons',
            type: 'symbol',
            source: 'markers',
            layout: {
                'icon-image': ['get', 'icon'],
                'icon-size': 0.6,
                'icon-allow-overlap': false,
                'icon-ignore-placement': true
            }
        })

        // Marker click handlers
        map.on('click', 'marker-circles', onMarkerClick)
        map.on('click', 'marker-icons', onMarkerClick)

        // Cursor hover
        map.on('mouseenter', 'marker-circles', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'marker-circles', () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', 'marker-icons', () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', 'marker-icons', () => { map.getCanvas().style.cursor = '' })

        updateMarkers()
    })

    // Map click → pick coordinate or close detail
    map.on('click', (e) => {
        // Check if click was on a marker
        const features = map.queryRenderedFeatures(e.point, { layers: ['marker-circles', 'marker-icons'] })
        if (features.length > 0) return  // let marker handler deal with it

        if (mapPickMode.value && currentPlace.value) {
            currentPlace.value.lat = e.lngLat.lat
            currentPlace.value.lng = e.lngLat.lng
            updateMarkers()
            if (pickMarker) pickMarker.remove()
            pickMarker = new MapLibre.Marker({ color: '#667eea', scale: 0.5 })
                .setLngLat(e.lngLat)
                .addTo(map)
            mapPickMode.value = false
        } else {
            closeDetail()
        }
    })
}

// Marker click handler
const onMarkerClick = (e) => {
    const props = e.features?.[0]?.properties
    if (!props) return

    const gi = props.groupIndex
    const pi = props.placeIndex

    selectPlace(gi, pi, false)

    // Show popup
    if (popup) popup.remove()
    const place = groups.value[gi]?.places[pi]
    const typeInfo = PLACE_TYPES[place?.type] || PLACE_TYPES['other']
    popup = new MapLibre.Popup({ offset: 25, maxWidth: '200px' })
        .setLngLat(e.lngLat)
        .setHTML(`
            <h3>${props.emoji} ${props.name}</h3>
            <span class="region-badge" style="background-color: ${props.groupColor}">${props.region}</span>
            <span class="type-badge" style="background-color: ${props.color}">${typeInfo.name}</span>
            ${props.hours ? `<p style="margin-top: 6px; font-size: 12px;">🕐 ${props.hours}</p>` : ''}
            <a href="${buildMapsLink(place)}" target="_blank" class="popup-link">📍 Google Maps</a>
        `)
        .addTo(map)
}

const updateMarkers = () => {
    if (!map) return

    const features = []

    groups.value.forEach((group, gi) => {
        group.places.forEach((place, pi) => {
            if (!place.lat || !place.lng) return
            const typeInfo = PLACE_TYPES[place.type] || PLACE_TYPES['other']
            const emoji = place.emoji || '📍'
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [place.lng, place.lat]  // [lng, lat]
                },
                properties: {
                    id: place.id,
                    name: place.name || '未命名',
                    emoji: emoji,
                    icon: `emoji-${emoji}`,  // sprite key
                    color: typeInfo.color,
                    region: getRegionName(place.region),
                    groupColor: getGroupColor(gi),
                    hours: place.hours || '',
                    groupIndex: gi,
                    placeIndex: pi
                }
            })
        })
    })

    const source = map.getSource('markers')
    if (source) {
        source.setData({ type: 'FeatureCollection', features })
    }

    // Fit bounds when markers exist
    if (features.length > 0) {
        const bounds = new MapLibre.LngLatBounds()
        features.forEach((f) => bounds.extend(f.geometry.coordinates))
        map.fitBounds(bounds, { padding: 60, animate: false })
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
    initialSnapshot = getDirtyState()
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
    // No invalidateSize needed — MapLibre handles resize automatically
    document.addEventListener('click', () => { hasInteracted = true }, { once: true })
    window.addEventListener('resize', checkMobile)
    window.addEventListener('beforeunload', (e) => {
        if (hasInteracted && getDirtyState() !== initialSnapshot) {
            e.preventDefault()
            e.returnValue = ''
        }
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    if (map) {
        map.remove()  // Properly destroy MapLibre map instance
        map = null
    }
})
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
.maplibregl-canvas { outline: none; }
.maplibregl-popup-content {
  padding: 8px !important;
  font-size: 13px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.maplibregl-popup-content h3 { margin: 0 0 4px 0; font-size: 14px; }
.maplibregl-popup-content .region-badge,
.maplibregl-popup-content .type-badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 10px; color: white; margin-right: 4px; }
.maplibregl-popup-content .popup-link { display: inline-block; margin-top: 6px; padding: 4px 10px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; }
.maplibregl-popup-tip { border-top-color: white !important; }
.maplibregl-popup-close-button { font-size: 18px; right: 4px; top: 2px; }
.maplibregl-ctrl-attrib a { color: rgba(0,0,0,0.75); }
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
    .group-editor-panel { width: 100%; }
}

.group-editor-btn { background: none; border: none; color: #667eea; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
.group-editor-btn:hover { background: #f0f4ff; }
.edit-group-btn { background: none; border: none; color: #667eea; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
.edit-group-btn:hover { background: #f0f4ff; }
.group-editor-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 1006; }
.group-editor-panel { position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: white; box-shadow: -4px 0 16px rgba(0,0,0,0.15); z-index: 1007; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
.group-editor-panel.open { transform: translateX(0); }
.group-editor-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center; }
.group-editor-header h3 { margin: 0; font-size: 16px; }
.group-editor-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.group-editor-body { flex: 1; overflow-y: auto; padding: 12px; }
.group-editor-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 8px; transition: all 0.2s; background: white; }
.group-editor-item:hover { background: #f8f9fa; }
.group-editor-item.drag-over { border-color: #667eea; background: #f0f4ff; box-shadow: 0 0 0 2px rgba(102,126,234,0.3); }
.group-editor-item.dragging { opacity: 0.4; }
.group-editor-drag-handle { cursor: grab; color: #999; font-size: 16px; user-select: none; flex-shrink: 0; }
.group-editor-drag-handle:active { cursor: grabbing; }
.group-editor-name { flex: 1; min-width: 0; }
.group-editor-name-text { font-weight: 600; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.group-editor-actions { display: flex; gap: 4px; flex-shrink: 0; }
.group-editor-actions button { padding: 4px 8px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; }
.group-editor-rename-btn { background: #fff3cd; color: #856404; }
.group-editor-rename-btn:hover { background: #856404; color: white; }
.group-editor-move-btn { background: #f0f4ff; color: #667eea; }
.group-editor-move-btn:hover:not(:disabled) { background: #667eea; color: white; }
.group-editor-move-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.group-editor-delete-btn { background: #fee; color: #e74c3c; }
.group-editor-delete-btn:hover { background: #e74c3c; color: white; }
.group-editor-empty { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
.group-editor-footer { padding: 12px; border-top: 1px solid #dee2e6; }
.group-editor-add-form { display: flex; gap: 6px; align-items: center; }
.group-editor-add-form input[type="text"] { flex: 1; padding: 8px 10px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; outline: none; }
.group-editor-add-form input[type="text"]:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.15); }
.group-editor-add-form .emoji-field { display: flex; gap: 4px; align-items: center; }
.group-editor-add-form .emoji-field input { width: 36px; height: 36px; border: 1px solid #dee2e6; border-radius: 6px; background: white; font-size: 18px; text-align: center; outline: none; }
.group-editor-add-form .emoji-field button { width: 36px; height: 36px; border: 1px solid #dee2e6; border-radius: 6px; background: white; font-size: 18px; cursor: pointer; }
.group-editor-add-form .emoji-field button:hover { background: #f0f4ff; }
.group-editor-add-btn { padding: 8px 16px; border: none; border-radius: 6px; background: #27ae60; color: white; font-size: 13px; cursor: pointer; flex-shrink: 0; }
.group-editor-add-btn:hover { background: #219a52; }

.plan-drive-export-btn { background: #fff3e0; color: #e65100; }
.plan-drive-export-btn:hover { background: #e65100; color: white; }
.plan-drive-import-btn { background: #fff3e0; color: #e65100; }
.plan-drive-import-btn:hover { background: #e65100; color: white; }

.settings-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 1008; }
.settings-panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; background: white; box-shadow: -4px 0 16px rgba(0,0,0,0.15); z-index: 1009; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease; }
.settings-panel.open { transform: translateX(0); }
.settings-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center; }
.settings-header h3 { margin: 0; font-size: 16px; }
.settings-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.settings-body { flex: 1; overflow-y: auto; padding: 16px; }
.settings-section { margin-bottom: 20px; }
.settings-section h4 { font-size: 14px; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #dee2e6; }
.drive-user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.drive-user-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.drive-user-details { flex: 1; }
.drive-user-name { font-weight: 600; font-size: 14px; color: #333; }
.drive-user-email { font-size: 12px; color: #666; }
.drive-disconnect-msg { font-size: 13px; color: #999; margin-bottom: 12px; }
.drive-login-btn { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #4285f4; color: white; font-size: 13px; cursor: pointer; transition: background 0.2s; }
.drive-login-btn:hover:not(:disabled) { background: #3367d6; }
.drive-login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.drive-logout-btn { width: 100%; padding: 10px; border: 1px solid #e74c3c; border-radius: 8px; background: #fee; color: #e74c3c; font-size: 13px; cursor: pointer; transition: background 0.2s; }
.drive-logout-btn:hover { background: #e74c3c; color: white; }
.drive-error-msg { color: #e74c3c; font-size: 12px; margin-top: 8px; }
.drive-folder-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #dee2e6; }
.drive-folder-section h4 { font-size: 13px; color: #333; margin-bottom: 6px; }
.drive-folder-desc { font-size: 11px; color: #999; margin-bottom: 12px; }
.drive-folder-empty { text-align: center; padding: 20px; color: #999; font-size: 12px; }
.drive-folder-list { max-height: 200px; overflow-y: auto; margin-bottom: 12px; }
.drive-folder-item { padding: 8px 10px; border: 1px solid #dee2e6; border-radius: 6px; margin-bottom: 4px; cursor: pointer; transition: all 0.2s; }
.drive-folder-item:hover { background: #f8f9fa; }
.drive-folder-item.selected { border-color: #667eea; background: #f0f4ff; }
.drive-folder-name { font-size: 12px; color: #333; }
.drive-folder-actions { display: flex; flex-direction: column; gap: 6px; }
.drive-create-folder-btn, .drive-init-folder-btn { width: 100%; padding: 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: background 0.2s; }
.drive-create-folder-btn { background: #f0f4ff; color: #667eea; }
.drive-create-folder-btn:hover:not(:disabled) { background: #667eea; color: white; }
.drive-create-folder-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.drive-init-folder-btn { background: #27ae60; color: white; }
.drive-init-folder-btn:hover:not(:disabled) { background: #219a52; }
.drive-init-folder-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.drive-create-folder-input { display: flex; gap: 6px; margin-top: 8px; }
.drive-create-folder-input input { flex: 1; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 12px; }
.drive-create-folder-input button { padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; background: #27ae60; color: white; }
.drive-create-folder-input button:disabled { opacity: 0.5; cursor: not-allowed; }

.drive-file-browser-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 1010; display: flex; align-items: center; justify-content: center; }
.drive-file-browser { width: 480px; max-width: 90vw; max-height: 80vh; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
.drive-file-browser-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center; }
.drive-file-browser-header h4 { margin: 0; font-size: 15px; }
.drive-file-browser-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.drive-file-browser-body { flex: 1; overflow-y: auto; padding: 12px; min-height: 0; }
.drive-file-browser-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px; border-top: 1px solid #dee2e6; }
.drive-file-item { padding: 10px 12px; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s; }
.drive-file-item:hover { background: #f8f9fa; }
.drive-file-item.selected { border-color: #667eea; background: #f0f4ff; }
.drive-file-info { display: flex; flex-direction: column; gap: 2px; }
.drive-file-name { font-weight: 500; font-size: 13px; color: #333; }
.drive-file-meta { font-size: 11px; color: #999; }
.drive-loading { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
.drive-empty { text-align: center; padding: 40px 20px; color: #999; font-size: 14px; }
.drive-cancel-btn { padding: 8px 16px; border: 1px solid #dee2e6; border-radius: 8px; background: white; color: #666; font-size: 13px; cursor: pointer; }
.drive-cancel-btn:hover { background: #f8f9fa; }
.drive-import-btn { padding: 8px 20px; border: none; border-radius: 8px; background: #667eea; color: white; font-size: 13px; cursor: pointer; }
.drive-import-btn:hover:not(:disabled) { background: #5568d3; }
.drive-import-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.drive-export-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 1010; display: flex; align-items: center; justify-content: center; }
.drive-export-dialog { width: 480px; max-width: 90vw; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
.drive-export-header { padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: space-between; align-items: center; }
.drive-export-header h4 { margin: 0; font-size: 15px; }
.drive-export-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.drive-export-body { padding: 16px; }
.drive-existing-files { margin-top: 12px; border-top: 1px solid #dee2e6; padding-top: 12px; }
.drive-existing-title { font-size: 12px; color: #666; margin-bottom: 8px; }
.drive-export-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px; border-top: 1px solid #dee2e6; flex-wrap: wrap; }
.drive-upload-btn { padding: 8px 20px; border: none; border-radius: 8px; background: #27ae60; color: white; font-size: 13px; cursor: pointer; }
.drive-upload-btn:hover:not(:disabled) { background: #219a52; }
.drive-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.drive-overwrite-btn { padding: 8px 20px; border: none; border-radius: 8px; background: #e65100; color: white; font-size: 13px; cursor: pointer; }
.drive-overwrite-btn:hover:not(:disabled) { background: #bf360c; }
.drive-overwrite-btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
    .settings-panel { width: 100%; }
    .drive-file-browser { width: 95vw; max-height: 90vh; }
    .drive-export-dialog { width: 95vw; }
}
</style>
