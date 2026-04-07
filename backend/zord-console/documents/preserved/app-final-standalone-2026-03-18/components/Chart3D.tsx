'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useState } from 'react'
import { MoreVertical, Zap } from 'lucide-react'

const data = [
  { label: 'Initiated Payments', shortLabel: 'Initiated', value: 65200, color: '#93c5fd' },
  { label: 'Authorized Payments', shortLabel: 'Authorized', value: 54800, color: '#60a5fa' },
  { label: 'Successful Payments', shortLabel: 'Successful', value: 48600, color: '#3b82f6' },
  { label: 'Payouts to Merchants', shortLabel: 'Payouts', value: 38300, color: '#1e40af' },
  { label: 'Completed Transactions', shortLabel: 'Completed', value: 32900, color: '#0c1e4d' },
]

const MAX_Y = 70000

function Bar3D({ position, height, color, label, value, isHovered }: any) {
  return (
    <group position={position}>
      {/* Main bar */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={isHovered ? 0.3 : 0.6}
          emissive={isHovered ? color : '#000000'}
          emissiveIntensity={isHovered ? 0.5 : 0}
        />
      </mesh>

      {/* Top cap */}
      {isHovered && (
        <mesh position={[0, height + 0.3, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#93c5fd" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, -2.5, 0]} center distanceFactor={1}>
        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
          {label}
        </div>
      </Html>

      {/* Value tooltip */}
      {isHovered && (
        <Html position={[0, height + 3, 0]} center distanceFactor={1}>
          <div className="bg-white text-xs text-gray-800 px-3 py-2 rounded-lg shadow-xl border border-gray-200 font-medium whitespace-nowrap">
            {(value / 1000).toFixed(1)}k
          </div>
        </Html>
      )}
    </group>
  )
}

function Scene3D({ hoveredIndex, setHoveredIndex }: any) {
  return (
    <>
      <color attach="background" args={['#f9fafb']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 5]} intensity={0.4} />

      {/* Grid ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: 13 }).map((_, i) => (
        <lineSegments key={`line-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-6, 0, i - 6, 6, 0, i - 6])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#e5e7eb" />
        </lineSegments>
      ))}

      {/* Y-Axis */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 35, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#9ca3af" linewidth={2} />
      </lineSegments>

      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.value / MAX_Y) * 30
        const spacing = 2.2
        const xPos = (index - 2) * spacing
        const isHovered = hoveredIndex === index

        return (
          <group
            key={index}
            onPointerEnter={() => setHoveredIndex(index)}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <Bar3D
              position={[xPos, 0, 0]}
              height={barHeight}
              color={item.color}
              label={item.shortLabel}
              value={item.value}
              isHovered={isHovered}
            />
          </group>
        )
      })}

      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        autoRotate={false}
        minDistance={15}
        maxDistance={40}
      />
    </>
  )
}

export default function Chart3D() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const legendItems = [
    { key: 'initiated', label: 'Initiated Payments', value: '65.2k' },
    { key: 'authorized', label: 'Authorized Payments', value: '54.8k' },
    { key: 'successful', label: 'Successful Payments', value: '48.6k' },
    { key: 'payouts', label: 'Payouts to Merchants', value: '38.3k' },
    { key: 'completed', label: 'Completed Transactions', value: '32.9k' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Payments 3D</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-8 overflow-x-auto pb-2">
          {legendItems.map((item, index) => (
            <div
              key={item.key}
              className={`whitespace-nowrap cursor-pointer transition-opacity ${
                hoveredIndex === index ? 'opacity-100' : 'opacity-60'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className={`text-lg font-semibold ${
                index === 2 ? 'text-black' : 'text-gray-400'
              }`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full" style={{ height: '500px' }}>
        <Canvas camera={{ position: [0, 12, 15], fov: 50 }}>
          <Scene3D hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />
        </Canvas>
      </div>

      {/* AI Prompt Section */}
      <div className="p-8 bg-blue-50 border-t border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-700 font-semibold">What would you like to explore next?</h3>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border border-gray-300">
          <span className="text-gray-700">I want to know what caused the drop-off from authorized to </span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded font-medium text-sm">
            /successful payments
          </span>
          <span className="text-gray-500 ml-1">|</span>
        </div>
      </div>
    </div>
  )
}
