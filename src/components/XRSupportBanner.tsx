"use client"

import { useEffect, useState } from 'react'

export default function XRSupportBanner() {
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (typeof navigator === 'undefined' || !('xr' in navigator)) {
        mounted && setSupported(false)
        return
      }
      try {
        const xr = (navigator as any).xr
        const isSupported = await xr?.isSessionSupported?.('immersive-ar')
        mounted && setSupported(!!isSupported)
      } catch {
        mounted && setSupported(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (supported === null) return null
  if (supported) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#111827',
        color: '#fff',
        padding: '10px 16px',
        zIndex: 60,
      }}
    >
      お使いの環境ではWebXRのARが利用できない可能性があります。対応端末のモバイルブラウザ（HTTPS）でお試しください。
    </div>
  )
}


