import React, { useEffect, useRef, useState } from 'react'
import { loadOpenCV } from '@/lib/loadOpenCV'
import { trackMarker, COLOR_PRESETS } from '@/lib/markerTracker'

// A-Frameはブラウザ環境に依存するため、SSR時にimportしない
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('aframe')
}

const ARView = ({ onSceneReady, isTracking, selectedPreset, onReset }) => {
  const sceneRef = useRef(null)
  const [markerPos, setMarkerPos] = useState(null)
  const [coveragePercent, setCoveragePercent] = useState(0)
  const cvRef = useRef(null)
  const videoRef = useRef(null)
  const rafRef = useRef(null)
  const paintCanvasRef = useRef(null)

  useEffect(() => {
    // カスタムコンポーネントを登録（まだの場合）
    if (typeof window !== 'undefined' && window.AFRAME) {
      if (!window.AFRAME.components['ar-cursor']) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./aframe-ar-cursor')
      }
      if (!window.AFRAME.components['paint-canvas']) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./aframe-paint-canvas')
      }
    }

    // A-Sceneが完全に読み込まれるのを待つ
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const handleLoaded = () => {
      if (typeof onSceneReady === 'function') {
        onSceneReady(sceneEl)
      }
    }

    if (sceneEl.hasLoaded) {
      handleLoaded()
    } else {
      sceneEl.addEventListener('loaded', handleLoaded)
      return () => sceneEl.removeEventListener('loaded', handleLoaded)
    }
  }, [onSceneReady])

  useEffect(() => {
    // OpenCV読み込み（一度だけ）
    loadOpenCV()
      .then((cv) => {
        cvRef.current = cv
      })
      .catch((err) => console.warn('OpenCV load failed', err))
  }, [])

  useEffect(() => {
    // RESET対応
    if (onReset) {
      onReset(() => {
        if (paintCanvasRef.current) {
          paintCanvasRef.current.components['paint-canvas'].reset()
        }
      })
    }
  }, [onReset])

  // マーカー追跡ループ
  useEffect(() => {
    if (!isTracking || !cvRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const trackLoop = () => {
      // A-FrameのカメラからvideoElementを取得（簡易実装: getUserMedia経由も可）
      if (sceneRef.current) {
        const renderer = sceneRef.current.renderer
        const xr = renderer?.xr
        if (xr && xr.isPresenting) {
          // XRセッション中: 実際のカメラフレームへのアクセスは制限あり
          // ここではダミー処理（実機では別途video要素を用意するか、AR session APIを使う）
        }
      }

      // デモ用: videoRefが設定されていればtrackMarker呼び出し
      if (videoRef.current && selectedPreset) {
        const preset = COLOR_PRESETS[selectedPreset]
        const pos = trackMarker(videoRef.current, cvRef.current, preset)
        setMarkerPos(pos)
        
        // 描画canvasへ軌跡を追加
        if (pos && paintCanvasRef.current) {
          paintCanvasRef.current.components['paint-canvas'].drawPoint(pos.x, pos.y)
          // 面積更新（毎フレームは重いので間引き可）
          const percent = paintCanvasRef.current.components['paint-canvas'].getCoveredPercentage()
          setCoveragePercent(percent)
        }
      }

      rafRef.current = requestAnimationFrame(trackLoop)
    }

    trackLoop()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isTracking, selectedPreset])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <a-scene
        ref={sceneRef}
        renderer="colorManagement: true; antialias: true"
        webxr="optionalFeatures: hit-test,dom-overlay,local-floor; overlayElement: #ar-overlay"
        vr-mode-ui="enabled: false"
        ar-cursor="cursorId: ar-cursor"
        embedded
        style={{ width: '100%', height: '100%' }}
      >
        {/* カメラ */}
        <a-camera position="0 1.6 0" wasd-controls-enabled="false" look-controls="enabled: true"></a-camera>

        {/* テスト用の立方体 */}
        <a-box position="0 0 -1.5" depth="0.3" height="0.3" width="0.3" color="#4f46e5" shadow="cast: true; receive: true"></a-box>

        {/* レティクル（床の推定位置を示す円） */}
        <a-ring
          id="ar-cursor"
          radius-inner="0.15"
          radius-outer="0.2"
          rotation="-90 0 0"
          material="color: #10b981; shader: flat; opacity: 0.8; transparent: true"
          visible="false"
        ></a-ring>

        {/* 床面描画用canvas */}
        <a-entity ref={(el) => (paintCanvasRef.current = el)} paint-canvas="width: 512; height: 512" position="0 0 -1"></a-entity>

        {/* 環境ライト */}
        <a-entity light="type: ambient; color: #BBB"></a-entity>
        <a-entity light="type: directional; intensity: 0.6" position="1 1 0"></a-entity>
      </a-scene>

      {/* DOM Overlay用の要素 */}
      <div id="ar-overlay" style={{ position: 'absolute', top: 6, left: 12, color: '#000', zIndex: 1000, pointerEvents: 'none' }}>
        AR Mode
        <div style={{ marginTop: 8, fontSize: 18, fontWeight: 'bold' }}>掃除面積: {coveragePercent.toFixed(1)}%</div>
      </div>

      {/* マーカー検出位置のデバッグ表示 */}
      {markerPos && (
        <div
          style={{
            position: 'absolute',
            left: `${markerPos.x * 100}%`,
            top: `${markerPos.y * 100}%`,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(255, 0, 0, 0.7)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

export default ARView


