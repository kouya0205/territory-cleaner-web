"use client"

import { useEffect, useState, type ComponentType } from 'react'
import ControlsOverlay from '@/components/ControlsOverlay'
import XRSupportBanner from '@/components/XRSupportBanner'
import ToolSelector from '@/components/ToolSelector'

export default function Home() {
  const [ClientARView, setClientARView] = useState<ComponentType | null>(null)
  const [sceneEl, setSceneEl] = useState<any>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('fluorescent_pink')
  const [resetFn, setResetFn] = useState<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import('@/components/ARView')
      if (mounted) {
        const Comp = () => (
          <mod.default
            onSceneReady={(el: any) => setSceneEl(el)}
            isTracking={isTracking}
            selectedPreset={selectedPreset}
            onReset={(fn: () => void) => setResetFn(() => fn)}
          />
        )
        setClientARView(() => Comp)
      }
    })()
    return () => {
      mounted = false
    }
  }, [isTracking, selectedPreset])

  return (
    <main className="min-h-screen">
      <XRSupportBanner />
      {ClientARView ? <ClientARView /> : <div className="p-6">Loading AR…</div>}
      <ToolSelector selectedPreset={selectedPreset} onSelectPreset={setSelectedPreset} />
      <ControlsOverlay
        onStart={() => {
          if (sceneEl && sceneEl.enterAR) sceneEl.enterAR()
          setIsTracking(true)
        }}
        onStop={() => {
          if (sceneEl && sceneEl.exitVR) sceneEl.exitVR()
          setIsTracking(false)
        }}
        onReset={() => {
          if (resetFn) resetFn()
        }}
      />
    </main>
  )
}


