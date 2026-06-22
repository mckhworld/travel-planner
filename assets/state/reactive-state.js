import { ref, reactive, computed } from 'vue'

export function createReactiveState(DEFAULT_DATA) {
    // Groups state
    const groups = ref(JSON.parse(JSON.stringify(DEFAULT_DATA.groups)))
    
    // Place selection state
    const selectedPlace = ref(null)
    const dropdownVisibility = reactive({})
    
    // Current place computed
    const currentPlace = computed(() => {
        const sp = selectedPlace.value
        if (sp && sp.groupIndex != null && sp.placeIndex != null) {
            return groups.value[sp.groupIndex]?.places[sp.placeIndex] || {}
        }
        return {}
    })
    
    // Coords input computed
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
                    const [latStr, lngStr] = val.split(',').map(s => parseFloat(s.trim()))
                    p.lat = latStr
                    p.lng = lngStr
                }
            }
        }
    })
    
    // Filter state
    const filter = reactive({ search: '', region: null, type: null })
    
    // Emoji picker state
    const showEmojiPicker = ref(false)
    const emojiPickerTarget = ref(null)
    
    // Add group form state
    const showAddGroupForm = ref(false)
    const newGroupForm = reactive({ name: '', emoji: '📌' })
    
    // Drag state
    const dragState = reactive({ draggingPlace: null, draggingGroup: null, overGroup: null, overPlaceIndex: null, dragOverPosition: null })
    
    // Mobile state
    const isMobile = ref(false)
    const mobileSidebarOpen = ref(false)
    
    // Plan selector state
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
    
    // Map state
    let map = null
    let markers = {}
    const mapPickMode = ref(false)
    let pickMarker = null
    
    // Mobile helper functions
    const checkMobile = () => {
        isMobile.value = window.innerWidth <= 768
        if (!isMobile.value) {
            mobileSidebarOpen.value = false
        }
    }
    
    const toggleMobileSidebar = () => {
        mobileSidebarOpen.value = !mobileSidebarOpen.value
        if (mobileSidebarOpen.value && selectedPlace.value) {
            // Close detail when opening sidebar
            closeDetail()
        }
    }
    
    return {
        groups,
        selectedPlace,
        dropdownVisibility,
        currentPlace,
        coordsInput,
        filter,
        showEmojiPicker,
        emojiPickerTarget,
        showAddGroupForm,
        newGroupForm,
        dragState,
        isMobile,
        mobileSidebarOpen,
        showPlanSelector,
        showPlanCreateInput,
        newPlanName,
        createPlanError,
        importFileInput,
        editingPlanId,
        editingPlanName,
        currentPlanIdVal,
        allPlansObjRef,
        allPlansListRef,
        currentPlanNameRef,
        mapPickMode,
        checkMobile,
        toggleMobileSidebar
    }
}
