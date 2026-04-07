import { execFileSync, spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const port = process.env.PORT || '3000'
const portsToClean = Array.from(new Set([port, '3001']))
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

function getPidsListeningOnPort(targetPort) {
  const output = safeRun('lsof', ['-tiTCP:' + targetPort, '-sTCP:LISTEN'])
  return output
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
}

function getProcessCwd(pid) {
  const output = safeRun('lsof', ['-p', pid])
  const cwdLine = output
    .split('\n')
    .find((line) => line.includes(' cwd '))

  if (!cwdLine) {
    return ''
  }

  const match = cwdLine.match(/ cwd .* (\/.*)$/)
  return match?.[1]?.trim() || ''
}

function stopStaleConsoleServers() {
  const pids = new Set()
  for (const targetPort of portsToClean) {
    for (const pid of getPidsListeningOnPort(targetPort)) {
      pids.add(pid)
    }
  }

  for (const pid of pids) {
    const cwd = getProcessCwd(pid)
    if (cwd !== projectRoot) {
      continue
    }

    try {
      process.kill(Number(pid), 'SIGTERM')
      console.log(`[dev] stopped stale zord-console process ${pid}`)
    } catch (error) {
      console.warn(`[dev] could not stop process ${pid}: ${error.message}`)
    }
  }
}

stopStaleConsoleServers()

if (shouldClean) {
  cleanCaches()
}

const nextBinary = process.platform === 'win32'
  ? join(projectRoot, 'node_modules', '.bin', 'next.cmd')
  : join(projectRoot, 'node_modules', '.bin', 'next')

const child = spawn(nextBinary, ['dev', '-p', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
