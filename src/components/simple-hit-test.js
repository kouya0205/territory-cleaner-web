// シンプルなHit-test実装
// useEffectから直接呼び出す

export function setupHitTest(sceneEl) {
  if (!sceneEl) return

  let hitTestSource = null
  let hitTestSourceRequested = false
  let refSpace = null
  const reticle = document.getElementById('ar-cursor')
  const debugEl = document.getElementById('debug-info')

  function updateDebug(msg) {
    if (debugEl) debugEl.textContent = msg
  }

  function onSessionStart() {
    const session = sceneEl.renderer?.xr?.getSession()
    
    if (!session) {
      updateDebug('❌ セッション取得失敗')
      return
    }

    updateDebug('1) セッション取得✓')

    session.addEventListener('end', () => {
      hitTestSourceRequested = false
      hitTestSource = null
      if (reticle) reticle.setAttribute('visible', false)
      updateDebug('終了')
    })

    // Reference spaceを取得
    session.requestReferenceSpace('local').then((space) => {
      refSpace = space
      updateDebug('2) RefSpace取得✓')
      
      // Hit-test sourceをすぐに取得開始
      return session.requestReferenceSpace('viewer')
    }).then((viewerSpace) => {
      updateDebug('3) Viewer space取得✓')
      return session.requestHitTestSource({ space: viewerSpace })
    }).then((source) => {
      hitTestSource = source
      hitTestSourceRequested = true
      updateDebug('4) Hit-source取得✓ 床を探しています...')
    }).catch((err) => {
      updateDebug('❌ エラー: ' + err.message)
    })
  }

  function onSessionEnd() {
    hitTestSourceRequested = false
    hitTestSource = null
    if (reticle) reticle.setAttribute('visible', false)
  }

  // イベントリスナー登録
  sceneEl.addEventListener('enter-vr', onSessionStart)
  sceneEl.addEventListener('exit-vr', onSessionEnd)

  // Tick処理 - 毎フレーム実行
  const renderLoop = () => {
    const frame = sceneEl.frame
    const session = sceneEl.renderer?.xr?.getSession()

    if (session && frame && hitTestSource && refSpace && reticle) {
      const hitTestResults = frame.getHitTestResults(hitTestSource)
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0]
        const pose = hit.getPose(refSpace)
        
        if (pose) {
          const pos = pose.transform.position
          reticle.setAttribute('position', { x: pos.x, y: pos.y, z: pos.z })
          reticle.setAttribute('visible', true)
          updateDebug('✅ 床検出中！')
        }
      } else {
        reticle.setAttribute('visible', false)
        // updateDebug('床を探しています...')  // メッセージ頻度を減らす
      }
    }
  }

  sceneEl.addEventListener('renderstart', renderLoop)

  updateDebug('初期化完了')

  return () => {
    sceneEl.removeEventListener('enter-vr', onSessionStart)
    sceneEl.removeEventListener('exit-vr', onSessionEnd)
  }
}

