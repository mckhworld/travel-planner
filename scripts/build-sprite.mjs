import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { loadImage } from 'canvas'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read COMMON_EMOJIS from constants.js
const constantsPath = resolve(__dirname, '../src/data/constants.js')
const constantsContent = readFileSync(constantsPath, 'utf-8')

// Extract COMMON_EMOJIS array from the constants file
const emojiMatch = constantsContent.match(/export const COMMON_EMOJIS = \[([\s\S]*?)\]/)
let emojiList = []

if (emojiMatch) {
  const emojiStr = emojiMatch[1]
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
    '🌟','💡','🔥','💧','🌈','☀️','🌙','⚡','❄️','🌬️',
    '⛩️','🐟','🏙️','🏘️','🌃','🏗️','🗿','⛪','🕌','🏢'
  ]
}

// Remove duplicates while preserving order
emojiList = [...new Set(emojiList)]

const ICON_SIZE = 32  // icon size in px
const COLS = 10       // icons per row
const ROWS = Math.ceil(emojiList.length / COLS)
const SCALE = 2       // @2x for retina

const canvas = createCanvas(COLS * ICON_SIZE * SCALE, ROWS * ICON_SIZE * SCALE)
const ctx = canvas.getContext('2d')
ctx.scale(SCALE, SCALE)
ctx.clearRect(0, 0, canvas.width, canvas.height)

// Twemoji: convert emoji to hex code point(s) for CDN URL
// Strip variation selector (fe0f) as Twemoji CDN doesn't serve them
const toTwemojiUrl = (emoji) => {
  const codePoints = [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0'))
    .filter(cp => cp !== 'fe0f')
  const joined = codePoints.join('-')
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${joined}.png`
}

// Fetch and render all emoji as SVG images onto canvas
const renderAll = async () => {
  console.log(`Fetching ${emojiList.length} emoji from Twemoji CDN...`)
  
  for (let i = 0; i < emojiList.length; i++) {
    const emoji = emojiList[i]
    const url = toTwemojiUrl(emoji)
    try {
      const img = await loadImage(url)
      const x = (i % COLS) * ICON_SIZE
      const y = Math.floor(i / COLS) * ICON_SIZE
      ctx.drawImage(img, x, y, ICON_SIZE, ICON_SIZE)
      if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${emojiList.length}`)
    } catch (e) {
      console.error(`  Failed to load ${emoji} (${url}): ${e.message}`)
    }
  }

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

  // Also write @2x variants for MapLibre retina resolution
  const png2xPath = resolve(__dirname, '../public/sprite@2x.png')
  const json2xPath = resolve(__dirname, '../public/sprite@2x.json')
  writeFileSync(png2xPath, canvas.toBuffer('image/png'))
  writeFileSync(json2xPath, JSON.stringify(sprite, null, 2) + '\n')

  console.log(`✅ Sprite generated: ${emojiList.length} unique emoji`)
  console.log(`   PNG: ${outputPath} (${COLS * ICON_SIZE}×${ROWS * ICON_SIZE}px @${SCALE}x)`)
  console.log(`   JSON: ${jsonPath}`)
  console.log(`   @2x PNG: ${png2xPath}`)
  console.log(`   @2x JSON: ${json2xPath}`)
  console.log(`   Icons: ${Object.keys(sprite).length}`)
}

renderAll().catch(console.error)
