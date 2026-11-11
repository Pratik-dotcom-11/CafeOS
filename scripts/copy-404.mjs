import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distIndex = path.resolve(__dirname, '../dist/index.html')
const dist404 = path.resolve(__dirname, '../dist/404.html')

if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, dist404)
  console.log('✓ Successfully copied dist/index.html to dist/404.html for SPA fallback routing')
} else {
  console.warn('dist/index.html not found, skipping 404 copy')
}

