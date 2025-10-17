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
  let frameCount = 0
  let lastHitCount = 0
  let lastDebugUpdate = 0
  
  const renderLoop = () => {
    frameCount++
    const frame = sceneEl.frame
    const session = sceneEl.renderer?.xr?.getSession()
    const now = Date.now()

    // デバッグ: 各要素の状態を確認（1秒に1回）
    if (now - lastDebugUpdate > 1000) {
      lastDebugUpdate = now
      if (!session) updateDebug(`[${frameCount}] session無し`)
      else if (!frame) updateDebug(`[${frameCount}] frame無し`)
      else if (!hitTestSource) updateDebug(`[${frameCount}] hitTestSource無し`)
      else if (!refSpace) updateDebug(`[${frameCount}] refSpace無し`)
      else if (!reticle) updateDebug(`[${frameCount}] reticle無し`)
      else updateDebug(`[${frameCount}] 検索中 hits:${lastHitCount}`)
    }

    if (session && frame && hitTestSource && refSpace && reticle) {
      try {
        const hitTestResults = frame.getHitTestResults(hitTestSource)
        lastHitCount = hitTestResults.length
        
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0]
          const pose = hit.getPose(refSpace)
          
          if (pose) {
            const pos = pose.transform.position
            reticle.setAttribute('position', { x: pos.x, y: pos.y, z: pos.z })
            reticle.setAttribute('visible', true)
            if (frameCount % 60 === 0) {
              updateDebug(`✅ 床検出！(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
            }
          }
        } else {
          reticle.setAttribute('visible', false)
        }
      } catch (err) {
        updateDebug('エラー: ' + err.message)
      }
    }
  }

  // 複数のイベントで試行
  sceneEl.addEventListener('renderstart', renderLoop)
  sceneEl.addEventListener('tick', renderLoop)
  
  // setIntervalでも強制的に実行
  const intervalId = setInterval(() => {
    renderLoop()
  }, 100) // 100ms = 10回/秒

  updateDebug('初期化完了 - ループ開始')

  return () => {
    sceneEl.removeEventListener('enter-vr', onSessionStart)
    sceneEl.removeEventListener('exit-vr', onSessionEnd)
    sceneEl.removeEventListener('renderstart', renderLoop)
    sceneEl.removeEventListener('tick', renderLoop)
    clearInterval(intervalId)
  }
}

