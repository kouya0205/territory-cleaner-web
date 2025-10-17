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

      console.log('[ar-cursor] Component initialized')

      // レティクル要素を探す
      this.el.addEventListener('loaded', () => {
        this.cursorEl = document.getElementById(this.data.cursorId)
        console.log('[ar-cursor] Cursor element found:', this.cursorEl ? 'yes' : 'no')
        if (this.cursorEl) {
          this.cursorEl.setAttribute('visible', false)
        }
      })

      this.el.addEventListener('enter-vr', () => {
        console.log('[ar-cursor] Entering VR/AR session')
        const session = this.el.renderer.xr.getSession()
        
        if (!session) {
          console.warn('[ar-cursor] No XR session found')
          return
        }

        console.log('[ar-cursor] XR session found, requesting hit-test')

        session
          .requestReferenceSpace('viewer')
          .then((space) => {
            console.log('[ar-cursor] Viewer space acquired')
            this.viewerSpace = space
            return session.requestHitTestSource({ space })
          })
          .then((hitTestSource) => {
            console.log('[ar-cursor] Hit test source acquired')
            this.xrHitTestSource = hitTestSource
          })
          .catch((err) => {
            console.error('[ar-cursor] Hit-test init failed:', err)
          })

        session.requestReferenceSpace('local').then((space) => {
          console.log('[ar-cursor] Local reference space acquired')
          this.refSpace = space
        })
      })

      this.el.addEventListener('exit-vr', () => {
        console.log('[ar-cursor] Exiting VR/AR session')
        if (this.xrHitTestSource) {
          this.xrHitTestSource.cancel()
          this.xrHitTestSource = null
        }
        this.viewerSpace = null
        this.refSpace = null
        if (this.cursorEl) {
          this.cursorEl.setAttribute('visible', false)
        }
      })
    },

    tick: function () {
      const frame = this.el.frame
      if (!frame || !this.xrHitTestSource || !this.refSpace || !this.cursorEl) {
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
        }
      } else {
        this.cursorEl.setAttribute('visible', false)
      }
    },
  })
}
