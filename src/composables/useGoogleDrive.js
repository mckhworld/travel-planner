import { reactive, nextTick } from 'vue'
import { useTokenClient } from 'vue3-google-signin'

const TOKEN_KEY = 'google-drive-token'
const USER_KEY = 'google-drive-user'
const FOLDER_KEY = 'google-drive-folder'
const DEFAULT_FOLDER_NAME = '.travel-planner-files'

function getTokenFromStorage() {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

function saveTokenToStorage(tokenData) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData))
}

function clearTokenFromStorage() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

function getUserFromStorage() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

function saveUserToStorage(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function getFolderFromStorage() {
    return localStorage.getItem(FOLDER_KEY) || null
}

function saveFolderToStorage(folderId) {
    if (folderId) {
        localStorage.setItem(FOLDER_KEY, folderId)
    } else {
        localStorage.removeItem(FOLDER_KEY)
    }
}

export function useGoogleDrive({ onAuthSuccess } = {}) {
    const state = reactive({
        isAuthenticated: false,
        userProfile: null,
        loginError: '',
        isLoading: false,
        selectedFolderId: getFolderFromStorage(),
    })

    function isTokenValid(stored) {
        if (!stored) return false
        const now = Date.now()
        return (stored.expiresAt || 0) > now
    }

    function getValidToken() {
        const stored = getTokenFromStorage()
        if (isTokenValid(stored)) {
            return stored.access_token
        }
        clearTokenFromStorage()
        state.isAuthenticated = false
        state.userProfile = null
        return null
    }

    function refreshAuthState() {
        const stored = getTokenFromStorage()
        const user = getUserFromStorage()
        if (stored && isTokenValid(stored)) {
            state.isAuthenticated = true
            state.userProfile = user
        } else {
            state.isAuthenticated = false
            state.userProfile = null
        }
    }

    refreshAuthState()

    async function ensureDefaultFolder() {
        const response = await driveRequest(
            `/files?q=name='${DEFAULT_FOLDER_NAME}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`
        )
        const data = await response.json()
        if (data.files && data.files.length > 0) {
            return data.files[0]
        }

        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getValidToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: DEFAULT_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            }),
        })

        if (!createResponse.ok) {
            const errorBody = await createResponse.json().catch(() => ({}))
            throw new Error(errorBody.error?.message || `建立資料夾失敗`)
        }

        return createResponse.json()
    }

    async function listFolders() {
        const response = await driveRequest(
            '/files?q=mimeType=\'application/vnd.google-apps.folder\'&fields=files(id,name)'
        )
        const data = await response.json()
        return (data.files || []).sort((a, b) => a.name.localeCompare(b.name))
    }

    async function createFolder(name) {
        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getValidToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                mimeType: 'application/vnd.google-apps.folder',
            }),
        })

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}))
            throw new Error(errorBody.error?.message || `建立資料夾失敗`)
        }

        return response.json()
    }

    function selectFolder(folderId) {
        state.selectedFolderId = folderId
        saveFolderToStorage(folderId)
    }

    const { login: googleLogin } = useTokenClient({
        scope: 'https://www.googleapis.com/auth/drive.file',
        onSuccess: (response) => {
            const tokenData = {
                access_token: response.access_token,
                expires_in: response.expires_in,
                expiresAt: Date.now() + (response.expires_in * 1000),
            }
            saveTokenToStorage(tokenData)

            const user = {
                name: response.profile?.name || '',
                email: response.profile?.email || '',
                picture: response.profile?.image_url || '',
            }
            saveUserToStorage(user)

            nextTick(() => {
                state.isAuthenticated = true
                state.userProfile = user
                state.loginError = ''
                if (typeof onAuthSuccess === 'function') {
                    onAuthSuccess()
                }
            })
        },
        onError: () => {
            nextTick(() => {
                state.loginError = 'Google 登入失敗，請稍後再試'
            })
        },
    })

    function login() {
        state.loginError = ''
        googleLogin()
    }

    function logout() {
        clearTokenFromStorage()
        state.isAuthenticated = false
        state.userProfile = null
    }

    async function driveRequest(path, options = {}) {
        const token = getValidToken()
        if (!token) {
            throw new Error('未登入 Google Drive')
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        })

        if (response.status === 401) {
            clearTokenFromStorage()
            state.isAuthenticated = false
            state.userProfile = null
            throw new Error('登入已過期，請重新連接')
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}))
            throw new Error(errorBody.error?.message || `Drive API 錯誤 (${response.status})`)
        }

        return response
    }

    async function listJsonFiles() {
        state.isLoading = true
        try {
            const folderId = state.selectedFolderId
            const query = folderId
                ? `parents='${folderId}'+and+mimeType='application/json'+and+trashed=false`
                : 'mimeType=\'application/json\'&trashed=false'
            const response = await driveRequest(
                `/files?q=${query}&fields=files(id,name,mimeType,size,modifiedTime,createdTime)`
            )
            const data = await response.json()
            return (data.files || []).sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''))
        } finally {
            state.isLoading = false
        }
    }

    async function downloadFile(fileId) {
        state.isLoading = true
        try {
            const response = await driveRequest(`/files/${fileId}?alt=media`)
            const text = await response.text()
            return JSON.parse(text)
        } finally {
            state.isLoading = false
        }
    }

    async function uploadFile(name, jsonContent) {
        state.isLoading = true
        try {
            const token = getValidToken()
            if (!token) throw new Error('未登入 Google Drive')

            const folderId = state.selectedFolderId
            const metadata = JSON.stringify({ name, mimeType: 'application/json', parents: folderId ? [folderId] : undefined })
            const body = JSON.stringify(jsonContent, null, 2)

            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2)
            const blob = new Blob([
                `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
                `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${body}\r\n`,
                `--${boundary}--\r\n`,
            ], { type: `multipart/related; boundary=${boundary}` })

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body: blob,
            })

            if (response.status === 401) {
                clearTokenFromStorage()
                state.isAuthenticated = false
                state.userProfile = null
                throw new Error('登入已過期，請重新連接')
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error?.message || `上傳失敗 (${response.status})`)
            }

            return await response.json()
        } finally {
            state.isLoading = false
        }
    }

    async function overwriteFile(fileId, jsonContent) {
        state.isLoading = true
        try {
            const token = getValidToken()
            if (!token) throw new Error('未登入 Google Drive')

            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonContent, null, 2),
            })

            if (response.status === 401) {
                clearTokenFromStorage()
                state.isAuthenticated = false
                state.userProfile = null
                throw new Error('登入已過期，請重新連接')
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error?.message || `覆蓋失敗 (${response.status})`)
            }

            return await response.json()
        } finally {
            state.isLoading = false
        }
    }

    const drive = reactive({
        ...state,
        login,
        logout,
        listJsonFiles,
        downloadFile,
        uploadFile,
        overwriteFile,
        refreshAuthState,
        ensureDefaultFolder,
        listFolders,
        createFolder,
        selectFolder,
    })

    return drive
}
