import { ref, computed } from 'vue'
import { useTokenClient, revokeAccessToken } from 'vue3-google-signin'

const TOKEN_KEY = 'google-drive-token'
const USER_KEY = 'google-drive-user'

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

export function useGoogleDrive() {
    const isAuthenticated = ref(false)
    const userProfile = ref(null)
    const loginError = ref('')
    const isLoading = ref(false)

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
        isAuthenticated.value = false
        userProfile.value = null
        return null
    }

    function refreshAuthState() {
        const stored = getTokenFromStorage()
        const user = getUserFromStorage()
        if (stored && isTokenValid(stored)) {
            isAuthenticated.value = true
            userProfile.value = user
        } else {
            isAuthenticated.value = false
            userProfile.value = null
        }
    }

    refreshAuthState()

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

            isAuthenticated.value = true
            userProfile.value = user
            loginError.value = ''
        },
        onError: (error) => {
            loginError.value = 'Google 登入失敗，請稍後再試'
        },
    })

    function login() {
        loginError.value = ''
        googleLogin()
    }

    function logout() {
        const token = getValidToken()
        if (token) {
            revokeAccessToken(token, () => {
                clearTokenFromStorage()
                isAuthenticated.value = false
                userProfile.value = null
            })
        } else {
            clearTokenFromStorage()
            isAuthenticated.value = false
            userProfile.value = null
        }
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
            isAuthenticated.value = false
            userProfile.value = null
            throw new Error('登入已過期，請重新連接')
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}))
            throw new Error(errorBody.error?.message || `Drive API 錯誤 (${response.status})`)
        }

        return response
    }

    async function listJsonFiles() {
        isLoading.value = true
        try {
            const response = await driveRequest(
                '/files?q=mimeType=\'application/json\'&fields=files(id,name,mimeType,size,modifiedTime,createdTime)'
            )
            const data = await response.json()
            return (data.files || []).sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''))
        } finally {
            isLoading.value = false
        }
    }

    async function downloadFile(fileId) {
        isLoading.value = true
        try {
            const response = await driveRequest(`/files/${fileId}?alt=media`)
            const text = await response.text()
            return JSON.parse(text)
        } finally {
            isLoading.value = false
        }
    }

    async function uploadFile(name, jsonContent) {
        isLoading.value = true
        try {
            const token = getValidToken()
            if (!token) throw new Error('未登入 Google Drive')

            const metadata = JSON.stringify({ name, mimeType: 'application/json' })
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
                isAuthenticated.value = false
                userProfile.value = null
                throw new Error('登入已過期，請重新連接')
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error?.message || `上傳失敗 (${response.status})`)
            }

            return await response.json()
        } finally {
            isLoading.value = false
        }
    }

    async function overwriteFile(fileId, jsonContent) {
        isLoading.value = true
        try {
            const token = getValidToken()
            if (!token) throw new Error('未登入 Google Drive')

            const body = JSON.stringify(jsonContent, null, 2)

            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2)
            const blob = new Blob([
                `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n`,
                `--${boundary}--\r\n`,
            ], { type: `multipart/related; boundary=${boundary}` })

            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body: blob,
            })

            if (response.status === 401) {
                clearTokenFromStorage()
                isAuthenticated.value = false
                userProfile.value = null
                throw new Error('登入已過期，請重新連接')
            }

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error?.message || `覆蓋失敗 (${response.status})`)
            }

            return await response.json()
        } finally {
            isLoading.value = false
        }
    }

    return {
        isAuthenticated,
        userProfile,
        loginError,
        isLoading,
        login,
        logout,
        listJsonFiles,
        downloadFile,
        uploadFile,
        overwriteFile,
        refreshAuthState,
    }
}
