'use client'

import { useEffect, useRef, useState } from 'react'

export default function NetSettlement3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let animationId: number

    const draw = (angle: number) => {
      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, width, height)

      // Draw axis lines
      const originX = width * 0.25
      const originY = height * 0.7
      const axisLength = 120

      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6

      // X axis (red)
      ctx.strokeStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(originX + axisLength, originY)
      ctx.stroke()

      // Y axis (green)
      ctx.strokeStyle = '#10b981'
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(originX, originY - axisLength)
      ctx.stroke()

      // Z axis (blue) - diagonal for 3D perspective
      ctx.strokeStyle = '#3b82f6'
      ctx.beginPath()
      ctx.moveTo(originX, originY)
      ctx.lineTo(originX + axisLength * 0.6, originY - axisLength * 0.6)
      ctx.stroke()

      ctx.globalAlpha = 1

      // Draw axis labels
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillStyle = '#64748b'

      // X axis label
      ctx.fillStyle = '#ef4444'
      ctx.fillText('X', originX + axisLength + 8, originY + 5)

      // Y axis label
      ctx.fillStyle = '#10b981'
      ctx.fillText('Y', originX - 12, originY - axisLength - 5)

      // Z axis label
      ctx.fillStyle = '#3b82f6'
      ctx.fillText('Z', originX + axisLength * 0.6 + 8, originY - axisLength * 0.6 - 5)

      // Draw 3D wave surface effect
      const centerX = width * 0.65
      const centerY = height * 0.5
      const waves = 11
      const angleRad = (angle * Math.PI) / 180

      for (let waveLayer = 0; waveLayer < waves; waveLayer++) {
        const layerAngle = angleRad + (waveLayer * Math.PI) / waves
        const amplitude = 32 - waveLayer * 2
        const baseY = centerY - waveLayer * 7

        ctx.beginPath()

        for (let x = centerX - 80; x < centerX + 80; x += 3) {
          const normalizedX = (x - (centerX - 80)) / 160
          const waveX = normalizedX * Math.PI * 2
          
          // Create wave using sine with rotation
          const waveHeight = Math.sin(waveX + layerAngle) * amplitude
          const perspectiveY = baseY + waveHeight

          if (x === centerX - 80) {
            ctx.moveTo(x, perspectiveY)
          } else {
            ctx.lineTo(x, perspectiveY)
          }
        }

        // Create gradient for each wave
        const hue = 30 + (waveLayer / waves) * 50 // Orange to yellow
        const saturation = 100
        const lightness = 50 - (waveLayer / waves) * 10

        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = 0.9 - (waveLayer / waves) * 0.3
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    const animate = () => {
      setRotation((prev) => (prev + 1) % 360)
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    // Redraw whenever rotation changes
    const redrawInterval = setInterval(() => {
      draw(rotation)
    }, 16)

    return () => {
      cancelAnimationFrame(animationId)
      clearInterval(redrawInterval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [rotation])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between px-6 pt-5 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Net Settlement Value</h3>
          <p className="text-xs text-slate-500">Compared to ₹21,340 last month</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-slate-900">₹32,134</span>
            <span className="text-sm font-semibold text-emerald-600">↑ 2.5%</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shadow-[0_10px_20px_rgba(99,102,241,0.25)]">
          ✦
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full flex-1 rounded-lg"
        style={{ minHeight: '280px' }}
      />

      <div className="px-6 pb-4 pt-2 flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-slate-600">X Axis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-600">Y Axis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-slate-600">Z Axis</span>
        </div>
      </div>
    </div>
  )
}
