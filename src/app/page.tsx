"use client"

import { useEffect, useState, useCallback } from 'react'
import XRSupportBanner from '@/components/XRSupportBanner'

export default function Home() {
  const [ClientARView, setClientARView] = useState<any>(null)
  const [sceneEl, setSceneEl] = useState<any>(null)

  const handleSceneReady = useCallback((el: any) => {
    setSceneEl(el)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import('@/components/ARView')
      if (mounted) {
        setClientARView(() => mod.default)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleStartAR = () => {
    if (sceneEl && sceneEl.enterAR) {
      sceneEl.enterAR()
    }
  }

  const handleStopAR = () => {
    if (sceneEl && sceneEl.exitVR) {
      sceneEl.exitVR()
    }
  }

  return (
    <main className="min-h-screen relative">
      <XRSupportBanner />
      
      {ClientARView ? (
        <ClientARView onSceneReady={handleSceneReady} />
      ) : (
        <div className="p-6 text-center">Loading AR Scene...</div>
      )}

      {/* コントロールボタン */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          zIndex: 50,
        }}
      >
        <button
          onClick={handleStartAR}
          style={{
            padding: '12px 24px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          START AR
        </button>
        <button
          onClick={handleStopAR}
          style={{
            padding: '12px 24px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          EXIT AR
        </button>
      </div>
    </main>
  )
}
