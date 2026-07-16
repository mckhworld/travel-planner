import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read COMMON_EMOJIS from constants.js
const constantsPath = resolve(__dirname, '../src/data/constants.js')
const constantsContent = readFileSync(constantsPath, 'utf-8')

// Extract COMMON_EMOJIS array from the constants file
const emojiMatch = constantsContent.match(/export const COMMON_EMOJIS = \[([\s\S]*?)\]/)
let emojiList = []

if (emojiMatch) {
  const emojiStr = emojiMatch[1]
  // Extract all emoji (including those with variation selectors)
  const emojiRegex = /'([\p{Emoji_Presentation}\p{Extended_Pictographic}]er{0,2})'/gu
  const matches = emojiStr.match(emojiRegex)
  if (matches) {
    emojiList = [...new Set(matches.map(m => m.slice(1, -1)))]
  }
}

// Fallback if regex fails
if (emojiList.length === 0) {
  emojiList = [
    '🗼','🗽','🏰','🏯','🏛️','🎡','🎢','🎠','🎪','🎭',
    '🏨','🏩','🏠','🏡','🛖','⛺','🏕️','🛏️','🛎️','🧳',
    '🍽️','🍴','🍜','🍕','🍔','🍣','🍱','🍛','🍤',
    '🍩','🍰','🧁','🍦','🍧','🍨','🍡','🍙','🍘','🍢',
    '☕','🍵','🍺','🍷','🍸','🍹','🧃','🥤','🧋','🥂',
    '🎨','🎬','🎤','🎸','🎮',
    '⛳','🎿','⛷️','🏄','🏊','🚴','🏃','🧗','🎯','🎳',
    '🌳','🌲','🌴','🌺','🌻','🌹','🌷','🌸','🌿','🍀',
    '🏞️','🌊','🏖️','🏔️','🗻','🌋','🌅','🌄','🌇','🌆',
    '✈️','🚀','🚁','🚂','🚄','🚅','🚆','🚇','🚈','🚉',
    '🚊','🚢','⛴️','🛳️','🚕','🚖','🚗','🚙','🚌','🚍',
    '🚎','🏎️','🛵','🚲','🛴','🛹','🛼','🛶','🚤','🛩️',
    '🛍️','🛒','💎','👜','👛','👓','🕶️','🧢','👗','👕',
    '🏺','🎻','🎼','🎹','🥁','🎺',
    '📍','🗺️','🧭','📸','🔔','🎉','🎊','✨','💫','⭐',
    '🌟','💡','🔥','💧','🌈','☀️','🌙','⚡','❄️','🌬️'
  ]
}

// Remove duplicates while preserving order
emojiList = [...new Set(emojiList)]

const ICON_SIZE = 32  // @1x size
const COLS = 10       // icons per row
const ROWS = Math.ceil(emojiList.length / COLS)
const SCALE = 2       // @2x for retina

const canvas = createCanvas(COLS * ICON_SIZE * SCALE, ROWS * ICON_SIZE * SCALE)
const ctx = canvas.getContext('2d')
ctx.scale(SCALE, SCALE)

// Clear with transparent background
ctx.clearRect(0, 0, canvas.width, canvas.height)

// Set font for emoji rendering
ctx.font = `${ICON_SIZE - 4}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "EmojiOne Color", "Android Emoji", sans-serif`
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'

// Render each emoji
emojiList.forEach((emoji, i) => {
  const x = (i % COLS) * ICON_SIZE + ICON_SIZE / 2
  const y = Math.floor(i / COLS) * ICON_SIZE + ICON_SIZE / 2
  ctx.fillText(emoji, x, y)
})

// Write sprite PNG
const outputPath = resolve(__dirname, '../public/sprite.png')
writeFileSync(outputPath, canvas.toBuffer('image/png'))

// Generate sprite JSON (MapLibre format)
const sprite = {}
emojiList.forEach((emoji, i) => {
  const row = Math.floor(i / COLS)
  const col = i % COLS
  const name = `emoji-${emoji}`
  sprite[name] = {
    height: ICON_SIZE * SCALE,
    pixelRatio: SCALE,
    width: ICON_SIZE * SCALE,
    x: col * ICON_SIZE * SCALE,
    y: row * ICON_SIZE * SCALE,
    mask: false
  }
})

const jsonPath = resolve(__dirname, '../public/sprite.json')
writeFileSync(jsonPath, JSON.stringify(sprite, null, 2) + '\n')

console.log(`✅ Sprite generated: ${emojiList.length} unique emoji`)
console.log(`   PNG: ${outputPath} (${COLS * ICON_SIZE}×${ROWS * ICON_SIZE}px @${SCALE}x)`)
console.log(`   JSON: ${jsonPath}`)
console.log(`   Icons: ${Object.keys(sprite).length}`)
