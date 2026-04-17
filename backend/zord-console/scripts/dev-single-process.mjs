import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const devPortFile = join(projectRoot, '.zord-console-dev-port')
const requestedPort = process.env.PORT || '3000'
const portsToClean = Array.from(new Set([requestedPort, '3001']))
const shouldClean = !process.argv.includes('--no-clean')

function run(command, args) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function safeRun(command, args) {
  try {
    return run(command, args)
  } catch {
    return ''
  }
}

function cleanCaches() {
  const targets = [
    join(projectRoot, '.next'),
    join(projectRoot, 'node_modules', '.cache'),
  ]

  for (const target of targets) {
    if (!existsSync(target)) {
      continue
    }

    rmSync(target, { recursive: true, force: true })
    console.log(`[dev] removed stale cache: ${target}`)
  }
}

function persistDevPort(port) {
  mkdirSync(projectRoot, { recursive: true })
  writeFileSync(devPortFile, `${port}\n`, 'utf8')
}

function clearPersistedDevPort() {
  if (!existsSync(devPortFile)) {
    return
  }

  rmSync(devPortFile, { force: true })
}

function getPidsListeningOnPort(targetPort) {
  const output = safeRun('lsof', ['-tiTCP:' + targetPort, '-sTCP:LISTEN'])
  return output
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
}

function getProcessInspection(pid) {
  return safeRun('lsof', ['-p', pid])
}

function parseProcessPath(inspection, token) {
  const line = inspection
    .split('\n')
    .find((value) => value.includes(` ${token} `))

  if (!line) {
    return ''
  }

  const match = line.match(new RegExp(` ${token} .* (\\/.*)$`))
  return match?.[1]?.trim() || ''
}

function getProcessCwd(inspection) {
  const output = inspection
  const cwdLine = output
    .split('\n')
    .find((line) => line.includes(' cwd '))

  if (!cwdLine) {
    return ''
  }

  const match = cwdLine.match(/ cwd .* (\/.*)$/)
  return match?.[1]?.trim() || ''
}

function getProcessExecutable(inspection) {
  return parseProcessPath(inspection, 'txt')
}

function getProcessInfo(pid) {
  const inspection = getProcessInspection(pid)
  return {
    pid,
    cwd: getProcessCwd(inspection),
    executable: getProcessExecutable(inspection),
    inspection,
  }
}

function isProjectProcess(processInfo) {
  return processInfo.cwd === projectRoot || processInfo.inspection.includes(projectRoot)
}

function describeProcess(processInfo) {
  const parts = [`pid ${processInfo.pid}`]
  if (processInfo.cwd) {
    parts.push(`cwd ${processInfo.cwd}`)
  }
  if (processInfo.executable) {
    parts.push(`exe ${processInfo.executable}`)
  }
  return parts.join(', ')
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPortToClear(targetPort, timeoutMs = 2500) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (getPidsListeningOnPort(targetPort).length === 0) {
      return true
    }

    await wait(100)
  }

  return getPidsListeningOnPort(targetPort).length === 0
}

function findFirstAvailablePort(startingPort, attempts = 10) {
  const start = Number.parseInt(startingPort, 10)
  if (!Number.isInteger(start)) {
    return startingPort
  }

  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = String(start + offset)
    if (getPidsListeningOnPort(candidate).length === 0) {
      return candidate
    }
  }

  return null
}

async function stopStaleConsoleServers() {
  const processMap = new Map()
  for (const targetPort of portsToClean) {
    for (const pid of getPidsListeningOnPort(targetPort)) {
      if (!processMap.has(pid)) {
        processMap.set(pid, getProcessInfo(pid))
      }
    }
  }

  const projectProcesses = [...processMap.values()].filter(isProjectProcess)

  for (const processInfo of projectProcesses) {
    try {
      process.kill(Number(processInfo.pid), 'SIGTERM')
      console.log(`[dev] stopped stale zord-console process ${processInfo.pid}`)
    } catch (error) {
      console.warn(`[dev] could not stop process ${processInfo.pid}: ${error.message}`)
    }
  }

  if (projectProcesses.length === 0) {
    return
  }

  for (const targetPort of portsToClean) {
    const didClear = await waitForPortToClear(targetPort)
    if (didClear) {
      continue
    }

    for (const pid of getPidsListeningOnPort(targetPort)) {
      const processInfo = getProcessInfo(pid)
      if (!isProjectProcess(processInfo)) {
        continue
      }

      try {
        process.kill(Number(pid), 'SIGKILL')
        console.warn(`[dev] force-killed stuck zord-console process ${pid}`)
      } catch (error) {
        console.warn(`[dev] could not force-kill process ${pid}: ${error.message}`)
      }
    }

    await waitForPortToClear(targetPort, 1000)
  }
}

function resolvePort() {
  const activeListeners = getPidsListeningOnPort(requestedPort).map((pid) => getProcessInfo(pid))

  if (activeListeners.length === 0) {
    return requestedPort
  }

  if (process.env.PORT) {
    const details = activeListeners.map(describeProcess).join('\n[dev]   ')
    throw new Error(
      `requested port ${requestedPort} is already in use.\n[dev]   ${details}\n[dev] choose another PORT or stop the conflicting process.`
    )
  }

  const fallbackPort = findFirstAvailablePort(String(Number(requestedPort) + 1))
  if (!fallbackPort) {
    const details = activeListeners.map(describeProcess).join('\n[dev]   ')
    throw new Error(
      `port ${requestedPort} is already in use and no fallback port was found.\n[dev]   ${details}`
    )
  }

  const details = activeListeners.map(describeProcess).join('\n[dev]   ')
  console.warn(`[dev] port ${requestedPort} is already in use by:`)
  console.warn(`[dev]   ${details}`)
  console.warn(`[dev] starting zord-console on fallback port ${fallbackPort}`)
  return fallbackPort
}

async function main() {
  await stopStaleConsoleServers()

  if (shouldClean) {
    cleanCaches()
  }

  const port = resolvePort()
  const analyticsBaseUrl = process.env.ZORD_ANALYTICS_URL || `http://localhost:${port}`

  const nextBinary = process.platform === 'win32'
    ? join(projectRoot, 'node_modules', '.bin', 'next.cmd')
    : join(projectRoot, 'node_modules', '.bin', 'next')

  console.log(`[dev] starting Next.js on http://localhost:${port}`)
  persistDevPort(port)

  const child = spawn(nextBinary, ['dev', '-p', port], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      ZORD_ANALYTICS_URL: analyticsBaseUrl,
    },
  })

  child.on('exit', (code, signal) => {
    clearPersistedDevPort()

    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`)
  process.exit(1)
})
