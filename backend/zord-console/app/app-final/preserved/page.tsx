import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'

const PRESERVED_ROOT = path.join(
  process.cwd(),
  'documents/preserved/app-final-standalone-2026-03-18'
)

const PREVIEWABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.md'])

type SearchParams = {
  file?: string | string[]
}

async function listFilesRecursively(dir: string, baseDir = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(fullPath, baseDir)))
      continue
    }

    const extension = path.extname(entry.name)
    if (!PREVIEWABLE_EXTENSIONS.has(extension)) {
      continue
    }

    files.push(path.relative(baseDir, fullPath).replaceAll(path.sep, '/'))
  }

  return files
}

function normalizeRequestedFile(input: string | string[] | undefined): string | null {
  if (!input || Array.isArray(input)) {
    return null
  }

  const normalized = path.posix.normalize(input.replaceAll('\\', '/'))
  if (!normalized || normalized.startsWith('/') || normalized.startsWith('../')) {
    return null
  }

  return normalized
}

export default async function PreservedAppFinalPreviewPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const allFiles = (await listFilesRecursively(PRESERVED_ROOT)).sort()
  const requested = normalizeRequestedFile(searchParams.file)
  const fallbackFile = allFiles.includes('app/page.tsx') ? 'app/page.tsx' : allFiles[0]
  const selectedFile = requested && allFiles.includes(requested) ? requested : fallbackFile

  const selectedAbsolutePath = selectedFile ? path.join(PRESERVED_ROOT, selectedFile) : null
  const selectedContent = selectedAbsolutePath
    ? await fs.readFile(selectedAbsolutePath, 'utf8')
    : 'No previewable files found in preserved snapshot.'

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1320px] rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A]">App-Final Preserved Snapshot</h1>
            <p className="text-sm text-[#64748B]">
              Source: <code>{PRESERVED_ROOT}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app-final"
              className="rounded-[10px] border border-black/[0.06] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              Open Active /app-final
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-black/[0.06] bg-[#F8FAFC] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              Files ({allFiles.length})
            </p>
            <div className="max-h-[68vh] space-y-1 overflow-auto pr-1">
              {allFiles.map((file) => {
                const isActive = file === selectedFile
                return (
                  <Link
                    key={file}
                    href={`/app-final/preserved?file=${encodeURIComponent(file)}`}
                    className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white text-[#334155] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {file}
                  </Link>
                )
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-black/[0.06] bg-[#0F172A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-3 text-xs text-[#94A3B8]">
              <span>Previewing:</span> <code className="text-[#E2E8F0]">{selectedFile}</code>
            </div>
            <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#020617] p-4 text-xs leading-6 text-[#E2E8F0]">
              {selectedContent}
            </pre>
          </section>
        </div>
      </div>
    </main>
  )
}
