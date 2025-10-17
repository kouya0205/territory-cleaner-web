"use client"

import { useEffect, useState, type ComponentType } from 'react'
import ControlsOverlay from '@/components/ControlsOverlay'

export default function Home() {
  const [ClientARView, setClientARView] = useState<ComponentType | null>(null)
  const [sceneEl, setSceneEl] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import('@/components/ARView')
      if (mounted) {
        const Comp = () => <mod.default onSceneReady={(el: any) => setSceneEl(el)} />
        setClientARView(() => Comp)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="min-h-screen">
      {ClientARView ? <ClientARView /> : <div className="p-6">Loading AR…</div>}
      <ControlsOverlay
        onStart={() => {
          if (sceneEl && sceneEl.enterAR) sceneEl.enterAR()
        }}
        onStop={() => {
          if (sceneEl && sceneEl.exitVR) sceneEl.exitVR()
        }}
        onReset={() => {
          // 後続でARViewにイベント連携予定
        }}
      />
    </main>
  )
}


