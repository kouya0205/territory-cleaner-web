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
    }).catch((err) => {
      updateDebug('❌ RefSpace失敗: ' + err.message)
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

  // Tick処理
  sceneEl.addEventListener('renderstart', () => {
    const frame = sceneEl.frame
    const session = sceneEl.renderer?.xr?.getSession()

    if (!session || !frame) return

    // Hit-test sourceをリクエスト（1回だけ）
    if (!hitTestSourceRequested && session.requestHitTestSourceForTransientInput) {
      hitTestSourceRequested = true
      session.requestHitTestSourceForTransientInput({ profile: 'generic-touchscreen' })
        .then((source) => {
          hitTestSource = source
          updateDebug('3) Hit-source取得✓ 床を探しています...')
        })
        .catch((err) => {
          updateDebug('❌ Hit-source失敗: ' + err.message)
          // フォールバック: viewer-based hit-test
          session.requestReferenceSpace('viewer').then((viewerSpace) => {
            return session.requestHitTestSource({ space: viewerSpace })
          }).then((source) => {
            hitTestSource = source
            updateDebug('3) Hit-source取得✓(代替)')
          }).catch((err2) => {
            updateDebug('❌ 代替も失敗: ' + err2.message)
          })
        })
    }

    // Hit-testを実行
    if (hitTestSource && refSpace && reticle) {
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
        updateDebug('床を探しています...')
      }
    }
  })

  updateDebug('初期化完了')

  return () => {
    sceneEl.removeEventListener('enter-vr', onSessionStart)
    sceneEl.removeEventListener('exit-vr', onSessionEnd)
  }
}

