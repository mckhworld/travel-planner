export function checkMobile(isMobileRef, mobileSidebarOpenRef) {
    isMobileRef.value = window.innerWidth <= 768
    if (!isMobileRef.value) {
        mobileSidebarOpenRef.value = false
    }
}

export function toggleMobileSidebar(mobileSidebarOpenRef, selectedPlaceRef, closeDetailFn) {
    mobileSidebarOpenRef.value = !mobileSidebarOpenRef.value
    if (mobileSidebarOpenRef.value && selectedPlaceRef.value) {
        // Close detail when opening sidebar
        closeDetailFn()
    }
}
