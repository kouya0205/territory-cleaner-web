"use client"

import { useEffect, useState, useCallback } from 'react'
import XRSupportBanner from '@/components/XRSupportBanner'

export default function Home() {
  const [ClientARView, setClientARView] = useState<any>(null)
  const [sceneEl, setSceneEl] = useState<any>(null)
  const [floorDrawing, setFloorDrawing] = useState<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [areaPercentage, setAreaPercentage] = useState(0)

  const handleSceneReady = useCallback((el: any, drawing: any) => {
    setSceneEl(el)
    setFloorDrawing(drawing)
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

  const handleStartDrawing = () => {
    if (floorDrawing) {
      floorDrawing.startDrawing()
      setIsDrawing(true)
    }
  }

  const handleStopDrawing = () => {
    if (floorDrawing) {
      floorDrawing.stopDrawing()
      setIsDrawing(false)
    }
  }

  const handleResetDrawing = () => {
    if (floorDrawing) {
      floorDrawing.resetDrawing()
      setAreaPercentage(0)
    }
  }

  const handleUpdateArea = () => {
    if (floorDrawing) {
      const percentage = floorDrawing.getAreaPercentage()
      setAreaPercentage(percentage)
    }
  }

  // 面積更新のための定期実行
  useEffect(() => {
    if (!isDrawing) return
    
    const interval = setInterval(() => {
      handleUpdateArea()
    }, 1000) // 1秒ごとに更新
    
    return () => clearInterval(interval)
  }, [isDrawing])

  return (
    <main className="min-h-screen relative">
      <XRSupportBanner />
      
      {ClientARView ? (
        <ClientARView onSceneReady={handleSceneReady} />
      ) : (
        <div className="p-6 text-center">Loading AR Scene...</div>
      )}

      {/* 面積表示 */}
      {isDrawing && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 'bold',
            zIndex: 50,
          }}
        >
          掃除面積: {areaPercentage.toFixed(1)}%
        </div>
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
          gap: 12,
          zIndex: 50,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleStartAR}
          style={{
            padding: '12px 20px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
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
            padding: '12px 20px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          EXIT AR
        </button>
        
        {/* 描画制御ボタン */}
        {floorDrawing && (
          <>
            {!isDrawing ? (
              <button
                onClick={handleStartDrawing}
                style={{
                  padding: '12px 20px',
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                START 描画
              </button>
            ) : (
              <button
                onClick={handleStopDrawing}
                style={{
                  padding: '12px 20px',
                  background: '#f59e0b',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                STOP 描画
              </button>
            )}
            <button
              onClick={handleResetDrawing}
              style={{
                padding: '12px 20px',
                background: '#6b7280',
                color: '#fff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              RESET
            </button>
          </>
        )}
      </div>
    </main>
  )
}
