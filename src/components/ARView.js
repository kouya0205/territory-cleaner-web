import React, { useEffect, useRef } from 'react'
import { setupHitTest } from './simple-hit-test'

// A-Frameはブラウザ環境に依存するため、SSR時にimportしない
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('aframe')
}

const ARView = ({ onSceneReady }) => {
  const sceneRef = useRef(null)
  const [debugInfo, setDebugInfo] = React.useState('初期化中...')

  useEffect(() => {
    // A-Sceneが完全に読み込まれるのを待つ
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const handleLoaded = () => {
      setDebugInfo('シーン読み込み完了')
      
      // シンプルなHit-testをセットアップ
      const cleanup = setupHitTest(sceneEl)
      setDebugInfo('Hit-test設定完了')
      
      if (typeof onSceneReady === 'function') {
        onSceneReady(sceneEl)
      }

      return cleanup
    }

    // デバッグ: AR開始を検知
    const handleEnterVR = () => {
      setDebugInfo('✓ ARセッション開始')
    }
    
    sceneEl.addEventListener('enter-vr', handleEnterVR)

    if (sceneEl.hasLoaded) {
      const cleanup = handleLoaded()
      return () => {
        sceneEl.removeEventListener('enter-vr', handleEnterVR)
        if (cleanup) cleanup()
      }
    } else {
      sceneEl.addEventListener('loaded', handleLoaded)
      return () => {
        sceneEl.removeEventListener('enter-vr', handleEnterVR)
      }
    }
  }, [onSceneReady])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <a-scene
        ref={sceneRef}
        renderer="colorManagement: true; antialias: true"
        webxr="optionalFeatures: hit-test,dom-overlay,local-floor; overlayElement: #ar-overlay"
        vr-mode-ui="enabled: false"
        embedded
        style={{ width: '100%', height: '100%' }}
      >
        {/* カメラ */}
        <a-camera position="0 1.6 0" wasd-controls-enabled="false" look-controls="enabled: true"></a-camera>

        {/* テスト用の立方体 */}
        <a-box position="0 0 -1.5" depth="0.3" height="0.3" width="0.3" color="#4f46e5"></a-box>

        {/* レティクル（床の推定位置を示す円） - Hit-test制御 */}
        <a-ring
          id="ar-cursor"
          radius-inner="0.25"
          radius-outer="0.35"
          rotation="-90 0 0"
          material="color: #10b981; shader: flat; side: double"
          visible="false"
        ></a-ring>

        {/* テスト用: 固定位置の緑の円（常に表示） */}
        <a-ring
          position="0 0 -2"
          radius-inner="0.25"
          radius-outer="0.35"
          rotation="-90 0 0"
          material="color: #f59e0b; shader: flat; side: double; opacity: 0.7; transparent: true"
        ></a-ring>

        {/* 環境ライト */}
        <a-entity light="type: ambient; color: #BBB"></a-entity>
        <a-entity light="type: directional; intensity: 0.6" position="1 1 0"></a-entity>
      </a-scene>

      {/* DOM Overlay用の要素 */}
      <div id="ar-overlay" style={{ position: 'absolute', top: 12, left: 12, color: '#fff', zIndex: 1000, pointerEvents: 'none', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>Territory Cleaner AR</div>
        <div style={{ marginTop: 4, fontSize: 14 }}>床を向けてください</div>
        <div style={{ marginTop: 8, fontSize: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4 }}>
          状態: {debugInfo}
        </div>
        <div id="debug-info" style={{ marginTop: 4, fontSize: 11, background: 'rgba(139, 0, 0, 0.8)', padding: '4px 8px', borderRadius: 4, color: '#ffff00' }}>
          待機中...
        </div>
      </div>
    </div>
  )
}

export default ARView
