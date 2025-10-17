import React, { useEffect, useRef, useState } from 'react'
import { loadOpenCV } from '@/lib/loadOpenCV'
import { trackMarker, COLOR_PRESETS } from '@/lib/markerTracker'

// A-Frameはブラウザ環境に依存するため、SSR時にimportしない
let aframeReact
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('aframe')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  aframeReact = require('aframe-react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./aframe-hit-test')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./aframe-paint-canvas')
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
    // WebXR対応ブラウザでのみ実行される前提
    if (sceneRef.current && typeof onSceneReady === 'function') {
      onSceneReady(sceneRef.current)
    }

    // OpenCV読み込み
    loadOpenCV()
      .then((cv) => {
        cvRef.current = cv
      })
      .catch((err) => console.warn('OpenCV load failed', err))

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

  if (!aframeReact) return null

  const { Scene, Entity } = aframeReact

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Scene
        ref={sceneRef}
        renderer="colorManagement: true"
        // WebXRのARモードを有効化
        webxr="mode: ar; optionalFeatures: hit-test,dom-overlay; overlayElement: #ar-overlay"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: true"
      >
        {/* カメラ */}
        <Entity primitive="a-camera" position="0 1.6 0" wasd-controls-enabled="false" look-controls="enabled: true" />

        {/* テスト用の立方体 */}
        <Entity
          primitive="a-box"
          position="0 0 -1.5"
          depth="0.3"
          height="0.3"
          width="0.3"
          color="#4f46e5"
          shadow="cast: true; receive: true"
        />

        {/* レティクル（床の推定位置を示す円） */}
        <Entity
          primitive="a-ring"
          ar-hit-test=""
          radius-inner="0.15"
          radius-outer="0.2"
          rotation="-90 0 0"
          material="color: #10b981; shader: flat; opacity: 0.8; transparent: true"
          visible={false}
        />

        {/* 床面描画用canvas */}
        <Entity ref={(el) => (paintCanvasRef.current = el)} paint-canvas="width: 512; height: 512" position="0 0 -1" />

        {/* 環境ライト */}
        <Entity primitive="a-entity" light="type: ambient; color: #BBB" />
        <Entity primitive="a-entity" light="type: directional; intensity: 0.6" position="1 1 0" />

        {/* DOM Overlay用の要素（オプション） */}
        <div id="ar-overlay" style={{ position: 'absolute', top: 12, left: 12, color: '#fff' }}>
          AR Mode
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 'bold' }}>掃除面積: {coveragePercent.toFixed(1)}%</div>
        </div>
      </Scene>

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


