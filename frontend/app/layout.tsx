import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zord Ingestion Console',
  description: 'Ingestion management and evidence tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
