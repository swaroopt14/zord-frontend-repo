'use client'

import { useState } from 'react'
import { exportAsCsv, exportAsJson, exportAsPdf } from '@/utils/zord-export'

interface ExportMenuProps {
  filename: string
  title: string
  rows: Array<Record<string, unknown>>
}

export function ExportMenu({ filename, title, rows }: ExportMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
      >
        Export
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-20 min-w-[120px] rounded-md border border-slate-600 bg-slate-900 p-1 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              exportAsCsv(filename, rows)
              setOpen(false)
            }}
            className="w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-slate-700"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => {
              exportAsJson(filename, rows)
              setOpen(false)
            }}
            className="w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-slate-700"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => {
              exportAsPdf(filename, title, rows)
              setOpen(false)
            }}
            className="w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-slate-700"
          >
            PDF
          </button>
        </div>
      ) : null}
    </div>
  )
}
