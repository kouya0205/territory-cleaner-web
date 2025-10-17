import React, { useEffect, useRef } from 'react'

// A-Frameはブラウザ環境に依存するため、SSR時にimportしない
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('aframe')
}

const ARView = ({ onSceneReady }) => {
  const sceneRef = useRef(null)
  const [debugInfo, setDebugInfo] = React.useState('初期化中...')

  useEffect(() => {
    // カスタムコンポーネントを登録
    if (typeof window !== 'undefined' && window.AFRAME) {
      if (!window.AFRAME.components['ar-cursor']) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./aframe-ar-cursor')
      }
    }

    // A-Sceneが完全に読み込まれるのを待つ
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const handleLoaded = () => {
      setDebugInfo('シーン読み込み完了')
      if (typeof onSceneReady === 'function') {
        onSceneReady(sceneEl)
      }
    }

    // デバッグ: AR開始を検知
    sceneEl.addEventListener('enter-vr', () => {
      setDebugInfo('ARセッション開始')
      setTimeout(() => {
        const cursor = document.getElementById('ar-cursor')
        if (cursor) {
          const isVisible = cursor.getAttribute('visible')
          setDebugInfo(`レティクル状態: ${isVisible}`)
        } else {
          setDebugInfo('レティクル要素が見つかりません')
        }
      }, 2000)
    })

    if (sceneEl.hasLoaded) {
      handleLoaded()
    } else {
      sceneEl.addEventListener('loaded', handleLoaded)
      return () => sceneEl.removeEventListener('loaded', handleLoaded)
    }
  }, [onSceneReady])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <a-scene
        ref={sceneRef}
        renderer="colorManagement: true; antialias: true"
        webxr="requiredFeatures: hit-test; optionalFeatures: dom-overlay,local-floor; overlayElement: #ar-overlay"
        vr-mode-ui="enabled: false"
        ar-cursor="cursorId: ar-cursor"
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
          {debugInfo}
        </div>
      </div>
    </div>
  )
}

export default ARView
