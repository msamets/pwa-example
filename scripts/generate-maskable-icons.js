const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const inputFile = path.join(__dirname, '../public/icon.svg')
const outputDir = path.join(__dirname, '../public')

async function generateMaskableIcons() {
  console.log('🎭 Generating maskable icons with proper padding...')

  const sizes = [192, 512]

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}-maskable.png`)

    try {
      // Create a background with 20% padding
      const iconSize = Math.round(size * 0.6) // Icon takes 60% of space (40% total padding)
      const padding = Math.round((size - iconSize) / 2)

      // Create background canvas
      const background = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue background
        }
      }).png()

      // Resize the icon to fit with padding
      const resizedIcon = await sharp(inputFile)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer()

      // Composite the icon onto the background
      await background
        .composite([{
          input: resizedIcon,
          top: padding,
          left: padding
        }])
        .toFile(outputFile)

      console.log(`✅ Generated ${size}x${size} maskable icon`)
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} maskable icon:`, error.message)
    }
  }

  console.log('🎉 Maskable icon generation complete!')
}

generateMaskableIcons().catch(console.error)