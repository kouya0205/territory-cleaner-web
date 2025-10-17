// A-Frame用のARカーソル（レティクル）システムコンポーネント
// <a-scene>に適用し、hit-testで取得した位置にレティクルエンティティを移動

if (typeof window !== 'undefined' && window.AFRAME && !window.AFRAME.components['ar-cursor']) {
  window.AFRAME.registerComponent('ar-cursor', {
    schema: {
      cursorId: { type: 'string', default: 'ar-cursor' },
    },

    init: function () {
      this.xrHitTestSource = null
      this.viewerSpace = null
      this.refSpace = null
      this.cursorEl = null
      this.debugEl = null

      // デバッグ表示要素を取得
      setTimeout(() => {
        this.debugEl = document.querySelector('#debug-info')
      }, 100)

      // レティクル要素を探す
      this.el.addEventListener('loaded', () => {
        this.cursorEl = document.getElementById(this.data.cursorId)
        if (this.cursorEl) {
          this.cursorEl.setAttribute('visible', false)
          this.updateDebug('カーソル要素: OK')
        } else {
          this.updateDebug('カーソル要素: 見つかりません')
        }
      })

      this.el.addEventListener('enter-vr', () => {
        this.updateDebug('VR開始...')
        const session = this.el.renderer.xr.getSession()
        
        if (!session) {
          this.updateDebug('エラー: XRセッション無し')
          return
        }

        this.updateDebug('Hit-test要求中...')

        session
          .requestReferenceSpace('viewer')
          .then((space) => {
            this.viewerSpace = space
            this.updateDebug('Viewer取得成功')
            return session.requestHitTestSource({ space })
          })
          .then((hitTestSource) => {
            this.xrHitTestSource = hitTestSource
            this.updateDebug('Hit-test: 成功✓')
          })
          .catch((err) => {
            this.updateDebug('エラー: ' + err.message)
          })

        session.requestReferenceSpace('local').then((space) => {
          this.refSpace = space
        })
      })

      this.el.addEventListener('exit-vr', () => {
        if (this.xrHitTestSource) {
          this.xrHitTestSource.cancel()
          this.xrHitTestSource = null
        }
        this.viewerSpace = null
        this.refSpace = null
        if (this.cursorEl) {
          this.cursorEl.setAttribute('visible', false)
        }
        this.updateDebug('VR終了')
      })
    },

    updateDebug: function (message) {
      if (this.debugEl) {
        this.debugEl.textContent = message
      }
    },

    tick: function () {
      const frame = this.el.frame
      
      if (!frame) {
        this.updateDebug('フレーム無し')
        return
      }
      
      if (!this.xrHitTestSource) {
        this.updateDebug('Hit-sourceまだ')
        return
      }
      
      if (!this.refSpace) {
        this.updateDebug('RefSpace無し')
        return
      }
      
      if (!this.cursorEl) {
        this.updateDebug('カーソル要素無し')
        return
      }

      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource)
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0]
        const pose = hit.getPose(this.refSpace)
        if (pose) {
          const position = pose.transform.position
          this.cursorEl.setAttribute('position', { x: position.x, y: position.y, z: position.z })
          this.cursorEl.setAttribute('visible', true)
          this.updateDebug('床検出中 ✓')
        }
      } else {
        this.cursorEl.setAttribute('visible', false)
        this.updateDebug('床を探しています...')
      }
    },
  })
}
