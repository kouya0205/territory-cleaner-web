"use client"

import { useEffect, useState, useCallback } from 'react'
import XRSupportBanner from '@/components/XRSupportBanner'

export default function Home() {
  const [ClientARView, setClientARView] = useState<any>(null)
  const [sceneEl, setSceneEl] = useState<any>(null)
  const [floorDrawing, setFloorDrawing] = useState<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [areaPercentage, setAreaPercentage] = useState(0)
  const [isARMode, setIsARMode] = useState(false)

  const handleSceneReady = useCallback((el: any, drawing: any) => {
    setSceneEl(el)
    setFloorDrawing(drawing)
  }, [])

  const handleARStateChange = useCallback((isARActive: boolean) => {
    setIsARMode(isARActive)
  }, [])

  // AR中の描画制御ボタンを生成
  const renderDrawingControls = () => {
    if (!floorDrawing) return null

    return (
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
      </>
    )
  }

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
      setIsARMode(true)
    }
  }

  const handleStopAR = () => {
    if (sceneEl && sceneEl.exitVR) {
      sceneEl.exitVR()
      setIsARMode(false)
      // AR終了時は描画も停止
      if (floorDrawing) {
        floorDrawing.stopDrawing()
        setIsDrawing(false)
      }
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
        <ClientARView 
          onSceneReady={handleSceneReady} 
          onARStateChange={handleARStateChange}
          drawingControls={isARMode ? renderDrawingControls() : null}
          areaPercentage={areaPercentage}
          isDrawing={isDrawing}
        />
      ) : (
        <div className="p-6 text-center">Loading AR Scene...</div>
      )}

      {/* コントロールボタン（AR未開始時のみ表示） */}
      {!isARMode && (
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
        </div>
      )}
    </main>
  )
}
