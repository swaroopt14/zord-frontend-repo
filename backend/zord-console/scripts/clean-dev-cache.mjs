import { existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

const targets = [
  join(projectRoot, '.next'),
  join(projectRoot, 'node_modules', '.cache'),
]

for (const target of targets) {
  if (!existsSync(target)) {
    console.log(`[clean] skip (not found): ${target}`)
    continue
  }

  rmSync(target, { recursive: true, force: true })
  console.log(`[clean] removed: ${target}`)
}

console.log('[clean] done')
