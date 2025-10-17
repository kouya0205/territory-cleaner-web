// A-Frame用のWebXR hit-testカスタムコンポーネント
// レティクル（床の推定位置を示す円）を画面中央からのhit-testで更新

if (typeof window !== 'undefined' && window.AFRAME) {
  window.AFRAME.registerComponent('ar-hit-test', {
    init: function () {
      this.xrHitTestSource = null
      this.viewerSpace = null
      this.refSpace = null

      this.el.sceneEl.addEventListener('enter-vr', () => {
        const session = this.el.sceneEl.renderer.xr.getSession()
        if (session && session.requestReferenceSpace) {
          session
            .requestReferenceSpace('viewer')
            .then((space) => {
              this.viewerSpace = space
              return session.requestHitTestSource({ space })
            })
            .then((hitTestSource) => {
              this.xrHitTestSource = hitTestSource
            })
            .catch((err) => console.warn('hit-test init failed', err))

          session.requestReferenceSpace('local').then((space) => {
            this.refSpace = space
          })
        }
      })

      this.el.sceneEl.addEventListener('exit-vr', () => {
        if (this.xrHitTestSource) {
          this.xrHitTestSource.cancel()
          this.xrHitTestSource = null
        }
        this.viewerSpace = null
        this.refSpace = null
      })
    },

    tick: function () {
      const frame = this.el.sceneEl.frame
      if (!frame || !this.xrHitTestSource || !this.refSpace) return

      const hitTestResults = frame.getHitTestResults(this.xrHitTestSource)
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0]
        const pose = hit.getPose(this.refSpace)
        if (pose) {
          const position = pose.transform.position
          this.el.setAttribute('position', { x: position.x, y: position.y, z: position.z })
          this.el.setAttribute('visible', true)
        }
      } else {
        this.el.setAttribute('visible', false)
      }
    },
  })
}

