export function createEmojiPicker(showEmojiPickerRef, emojiPickerTargetRef) {
    const openEmojiPicker = (target) => { 
        emojiPickerTargetRef.value = target; 
        showEmojiPickerRef.value = true 
    }
    
    const closeEmojiPicker = () => { showEmojiPickerRef.value = false }
    
    const selectEmoji = (emoji, groups, updateTimestamp) => {
        if (!emojiPickerTargetRef.value) return
        const { type, groupIndex, placeIndex } = emojiPickerTargetRef.value
        const now = updateTimestamp()
        
        if (type === 'group') {
            groups.value[groupIndex].emoji = emoji
            groups.value[groupIndex].modified = now
        } else if (type === 'place') {
            groups.value[groupIndex].places[placeIndex].emoji = emoji
            groups.value[groupIndex].places[placeIndex].modified = now
        }
        showEmojiPickerRef.value = false
    }
    
    return {
        openEmojiPicker,
        closeEmojiPicker,
        selectEmoji
    }
}
