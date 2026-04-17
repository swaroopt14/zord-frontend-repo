import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const devPortFile = join(projectRoot, '.zord-console-dev-port')

function resolvePort() {
  if (process.env.PORT) {
    return process.env.PORT
  }

  if (!existsSync(devPortFile)) {
    return '3000'
  }

  const persistedPort = readFileSync(devPortFile, 'utf8').trim()
  return persistedPort || '3000'
}

async function main() {
  const port = resolvePort()
  const url = `http://localhost:${port}/api/health`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`health check failed with ${response.status} ${response.statusText} at ${url}`)
  }

  console.log(`[health] ok ${url}`)
}

main().catch((error) => {
  console.error(`[health] ${error.message}`)
  process.exit(1)
})
