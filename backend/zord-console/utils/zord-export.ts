'use client'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildBasicPdf(lines: string[]): Blob {
  const safeLines = lines.slice(0, 45).map((line) => line.slice(0, 110))
  const textInstructions = safeLines
    .map((line, index) => `BT /F1 10 Tf 40 ${770 - (index * 15)} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
    `4 0 obj << /Length ${textInstructions.length} >> stream\n${textInstructions}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]

  let offset = 9
  const xrefOffsets = ['0000000000 65535 f ']
  const body = objects
    .map((obj) => {
      const chunk = `${obj}\n`
      const currentOffset = String(offset).padStart(10, '0')
      xrefOffsets.push(`${currentOffset} 00000 n `)
      offset += chunk.length
      return chunk
    })
    .join('')

  const xrefStart = 9 + body.length
  const xref = `xref\n0 ${objects.length + 1}\n${xrefOffsets.join('\n')}\n`
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  const pdf = `%PDF-1.4\n${body}${xref}${trailer}`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function exportAsJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`)
}

export function exportAsCsv(filename: string, rows: Array<Record<string, unknown>>): void {
  if (!rows.length) {
    const blob = new Blob(['No data'], { type: 'text/csv;charset=utf-8' })
    triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
    return
  }

  const headers = Array.from(
    rows.reduce<Set<string>>((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key))
      return acc
    }, new Set<string>()),
  )

  const csv = [
    headers.map((header) => escapeCsv(header)).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

export function exportAsPdf(filename: string, title: string, rows: Array<Record<string, unknown>>): void {
  const lines = [title, `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, '']

  rows.slice(0, 40).forEach((row, index) => {
    lines.push(`${index + 1}. ${Object.entries(row).map(([key, value]) => `${key}: ${String(value)}`).join(' | ')}`)
  })

  const blob = buildBasicPdf(lines)
  triggerDownload(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
