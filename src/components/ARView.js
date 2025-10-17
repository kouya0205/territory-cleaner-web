import React, { useEffect, useRef } from 'react'

// A-Frameはブラウザ環境に依存するため、SSR時にimportしない
let aframeReact
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('aframe')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  aframeReact = require('aframe-react')
}

const ARView = ({ onSceneReady }) => {
  const sceneRef = useRef(null)
  useEffect(() => {
    // WebXR対応ブラウザでのみ実行される前提
    if (sceneRef.current && typeof onSceneReady === 'function') {
      onSceneReady(sceneRef.current)
    }
  }, [])

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

        {/* 環境ライト */}
        <Entity primitive="a-entity" light="type: ambient; color: #BBB" />
        <Entity primitive="a-entity" light="type: directional; intensity: 0.6" position="1 1 0" />

        {/* DOM Overlay用の要素（オプション） */}
        <div id="ar-overlay" style={{ position: 'absolute', top: 12, left: 12, color: '#fff' }}>
          AR Mode
        </div>
      </Scene>
    </div>
  )
}

export default ARView


