export function createPlanUIManager(
    showPlanSelectorRef,
    showPlanCreateInputRef,
    newPlanNameRef,
    createPlanErrorRef,
    editingPlanIdRef,
    editingPlanNameRef
) {
    const formatDate = (iso) => {
        if (!iso) return ''
        const d = new Date(iso)
        const now = new Date()
        const diffMs = now - d
        const mins = Math.floor(diffMs / 60000)
        if (mins < 1) return '剛刚'
        if (mins < 60) return `${mins}分鐘前`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}小時前`
        const days = Math.floor(hrs / 24)
        if (days < 7) return `${days}天前`
        return d.toLocaleDateString('zh-TW')
    }
    
    const doCreatePlan = (createPlanFn, currentPlanIdValRef, refreshPlanRefsFn) => {
        if (!newPlanNameRef.value.trim()) {
            createPlanErrorRef.value = '請輸入行程名稱'
            return
        }
        const planId = createPlanFn(newPlanNameRef.value.trim())
        currentPlanIdValRef.value = planId
        refreshPlanRefsFn()
        newPlanNameRef.value = ''
        showPlanCreateInputRef.value = false
        createPlanErrorRef.value = ''
        showPlanSelectorRef.value = false
    }
    
    const doLoadPlan = (loadPlanFn, currentPlanIdValRef, refreshPlanRefsFn) => {
        if (loadPlanFn(currentPlanIdValRef.value)) {
            currentPlanIdValRef.value = currentPlanIdValRef.value
            refreshPlanRefsFn()
            showPlanSelectorRef.value = false
        }
    }
    
    const doDeletePlan = (deletePlanFn, currentPlanIdValRef, getAllPlans, refreshPlanRefsFn) => {
        if (!confirm('確定刪除此行程？')) return
        const plansData = getAllPlans()
        if (Object.keys(plansData.plans).length <= 1) {
            alert('至少需要保留一個行程')
            return
        }
        if (deletePlanFn(currentPlanIdValRef.value)) {
            currentPlanIdValRef.value = plansData.currentPlanId
            refreshPlanRefsFn()
        }
    }
    
    const handlePlanImport = (e, importPlanFn, currentPlanIdValRef, refreshPlanRefsFn) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result)
                if (!data.groups || !Array.isArray(data.groups)) {
                    alert('JSON 格式錯誤：缺少 groups 陣列')
                    return
                }
                const planId = importPlanFn(data)
                currentPlanIdValRef.value = planId
                refreshPlanRefsFn()
                showPlanSelectorRef.value = false
            } catch {
                alert('JSON 格式錯誤')
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }
    
    const doRenamePlan = (doRenamePlanFn, getAllPlans) => {
        if (!editingPlanNameRef.value.trim()) {
            alert('行程名稱不能為空')
            cancelRenamePlan()
            return
        }
        const plansData = getAllPlans()
        if (!plansData || !plansData.plans[editingPlanIdRef.value]) {
            cancelRenamePlan()
            return
        }
        // Check for duplicate names (excluding current plan)
        const newName = editingPlanNameRef.value.trim()
        const duplicate = Object.entries(plansData.plans).find(([id, p]) => id !== editingPlanIdRef.value && p.name === newName)
        if (duplicate) {
            alert(`已存在同名行程「${newName}」`)
            cancelRenamePlan()
            return
        }
        plansData.plans[editingPlanIdRef.value].name = newName
        localStorage.setItem('travel-map-plans', JSON.stringify(plansData))
        refreshPlanRefs()
        cancelRenamePlan()
    }
    
    const cancelRenamePlan = () => {
        editingPlanIdRef.value = null
        editingPlanNameRef.value = ''
    }
    
    const handleRenameBlur = (planId) => {
        if (editingPlanIdRef.value === planId) {
            doRenamePlan()
        }
    }
    
    const startRenamePlan = (plan) => {
        editingPlanIdRef.value = plan.id
        editingPlanNameRef.value = plan.name
    }
    
    const updateFieldType = (event, currentPlace) => {
        if (!currentPlace) return
        const now = new Date().toISOString()
        currentPlace.type = event.target.value
        currentPlace.modified = now
    }
    
    const updatePlaceLinks = (place, links) => {
        if (!place) return
        const now = new Date().toISOString()
        place.links = links
        place.modified = now
    }
    
    return {
        formatDate,
        doCreatePlan,
        doLoadPlan,
        doDeletePlan,
        handlePlanImport,
        doRenamePlan,
        cancelRenamePlan,
        handleRenameBlur,
        startRenamePlan,
        updateFieldType,
        updatePlaceLinks
    }
}
