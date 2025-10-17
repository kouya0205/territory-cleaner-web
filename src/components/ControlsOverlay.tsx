"use client"

import { useState } from 'react'

type Props = {
  onStart: () => void
  onStop: () => void
  onReset: () => void
}

export default function ControlsOverlay({ onStart, onStop, onReset }: Props) {
  const [running, setRunning] = useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    >
      {!running ? (
        <button
          onClick={() => {
            setRunning(true)
            onStart()
          }}
          style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', borderRadius: 8 }}
        >
          START
        </button>
      ) : (
        <button
          onClick={() => {
            setRunning(false)
            onStop()
          }}
          style={{ padding: '10px 16px', background: '#f59e0b', color: '#111', borderRadius: 8 }}
        >
          STOP
        </button>
      )}

      <button onClick={onReset} style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', borderRadius: 8 }}>
        RESET
      </button>
    </div>
  )
}


