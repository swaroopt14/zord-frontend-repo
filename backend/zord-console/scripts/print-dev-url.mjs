import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const devPortFile = join(projectRoot, '.zord-console-dev-port')

if (!existsSync(devPortFile)) {
  console.log('[dev] No active dev port file found. Start with `npm run dev` first.')
  process.exit(0)
}

const port = readFileSync(devPortFile, 'utf8').trim()
if (!port) {
  console.log('[dev] Dev port file exists but is empty. Start with `npm run dev` again.')
  process.exit(0)
}

console.log(`http://localhost:${port}`)
