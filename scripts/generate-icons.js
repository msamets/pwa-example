const fs = require('fs')
const path = require('path')

// Install sharp if not available: npm install sharp
let sharp
try {
  sharp = require('sharp')
} catch (err) {
  console.error('Sharp not found. Install it with: npm install sharp')
  process.exit(1)
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]
const inputFile = path.join(__dirname, '../public/icon.svg')
const outputDir = path.join(__dirname, '../public')

async function generateIcons() {
  console.log('🎨 Generating PNG icons from SVG...')

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`)

    try {
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile)

      console.log(`✅ Generated ${size}x${size} icon`)
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon:`, error.message)
    }
  }

  console.log('🎉 Icon generation complete!')
}

generateIcons().catch(console.error)