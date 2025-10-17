"use client"

import { COLOR_PRESETS } from '@/lib/markerTracker'

type Props = {
  selectedPreset: string
  onSelectPreset: (preset: string) => void
}

export default function ToolSelector({ selectedPreset, onSelectPreset }: Props) {
  const presets = Object.entries(COLOR_PRESETS)

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: 16,
        right: 16,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    >
      {presets.map(([key, preset]) => (
        <button
          key={key}
          onClick={() => onSelectPreset(key)}
          style={{
            padding: '8px 12px',
            background: selectedPreset === key ? '#3b82f6' : '#374151',
            color: '#fff',
            borderRadius: 6,
            fontSize: 14,
            border: selectedPreset === key ? '2px solid #60a5fa' : 'none',
          }}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}

