// A-Frame用の床面描画コンポーネント
// マーカー位置をcanvasに描画し、床面にテクスチャとして適用

if (typeof window !== 'undefined' && window.AFRAME && window.AFRAME.components && !window.AFRAME.components['paint-canvas']) {
  window.AFRAME.registerComponent('paint-canvas', {
    schema: {
      width: { type: 'number', default: 512 },
      height: { type: 'number', default: 512 },
    },

    init: function () {
      this.canvas = document.createElement('canvas')
      this.canvas.width = this.data.width
      this.canvas.height = this.data.height
      this.ctx = this.canvas.getContext('2d')
      this.ctx.fillStyle = 'rgba(0,0,0,0)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.canvasTexture = new window.THREE.CanvasTexture(this.canvas)
      this.canvasTexture.needsUpdate = true

      const geometry = new window.THREE.PlaneGeometry(2, 2)
      const material = new window.THREE.MeshBasicMaterial({
        map: this.canvasTexture,
        transparent: true,
        opacity: 0.7,
        side: window.THREE.DoubleSide,
      })
      this.mesh = new window.THREE.Mesh(geometry, material)
      this.mesh.rotation.x = -Math.PI / 2
      this.el.setObject3D('mesh', this.mesh)

      this.lastPos = null
    },

    drawPoint: function (x, y) {
      // x, y: 正規化座標 0-1 (マーカー検出位置)
      // canvas座標に変換
      const cx = x * this.canvas.width
      const cy = y * this.canvas.height

      this.ctx.fillStyle = 'rgba(59, 130, 246, 0.6)' // 青色
      this.ctx.beginPath()
      this.ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      this.ctx.fill()

      if (this.lastPos) {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
        this.ctx.lineWidth = 20
        this.ctx.lineCap = 'round'
        this.ctx.beginPath()
        this.ctx.moveTo(this.lastPos.x, this.lastPos.y)
        this.ctx.lineTo(cx, cy)
        this.ctx.stroke()
      }

      this.lastPos = { x: cx, y: cy }
      this.canvasTexture.needsUpdate = true
    },

    reset: function () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.fillStyle = 'rgba(0,0,0,0)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.lastPos = null
      this.canvasTexture.needsUpdate = true
    },

    getCoveredPercentage: function () {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const pixels = imageData.data
      let coveredCount = 0
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3]
        if (alpha > 10) coveredCount++
      }
      const totalPixels = this.canvas.width * this.canvas.height
      return (coveredCount / totalPixels) * 100
    },

    remove: function () {
      this.el.removeObject3D('mesh')
    },
  })
}

