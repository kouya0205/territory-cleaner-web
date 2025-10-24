// 床面描画システム
import * as THREE from 'three'

export function setupFloorDrawing(sceneEl) {
  const debugEl = document.getElementById('debug-info')
  
  let floorPlane = null
  let canvas = null
  let ctx = null
  let texture = null
  let material = null
  let isDrawing = false
  let drawingEnabled = false
  
  // Canvas設定
  const CANVAS_SIZE = 512
  const BRUSH_SIZE = 20
  
  function updateDebug(msg) {
    if (debugEl) debugEl.textContent = msg
  }
  
  function initCanvas() {
    // Canvas作成
    canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    ctx = canvas.getContext('2d')
    
    // 初期化（透明）
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    
    // Texture作成
    texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    // Material作成
    material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
    
    updateDebug('Canvas初期化完了')
  }
  
  function createFloorPlane() {
    if (!material) {
      updateDebug('❌ Material未作成')
      return
    }
    
    // 大きな床面を作成（2m x 2m）
    const geometry = new THREE.PlaneGeometry(2, 2)
    floorPlane = new THREE.Mesh(geometry, material)
    
    // 床面を水平に配置（Y=0）
    floorPlane.rotation.x = -Math.PI / 2
    floorPlane.position.y = 0
    
    // シーンに追加
    const scene = sceneEl.object3D
    scene.add(floorPlane)
    
    updateDebug('床面作成完了')
  }
  
  function worldToCanvas(worldPos) {
    if (!floorPlane) return null
    
    // ワールド座標を床面のローカル座標に変換
    const localPos = new THREE.Vector3()
    floorPlane.worldToLocal(localPos.copy(worldPos))
    
    // 床面のサイズ（2x2）をCanvasサイズ（512x512）にマッピング
    const x = ((localPos.x + 1) / 2) * CANVAS_SIZE
    const y = ((localPos.z + 1) / 2) * CANVAS_SIZE
    
    // Canvas範囲内かチェック
    if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
      return { x, y }
    }
    
    return null
  }
  
  function drawAtPosition(worldPos) {
    if (!ctx || !drawingEnabled) return
    
    const canvasPos = worldToCanvas(worldPos)
    if (!canvasPos) return
    
    // 青い円を描画
    ctx.fillStyle = '#3b82f6' // 青
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, BRUSH_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Texture更新
    texture.needsUpdate = true
    
    updateDebug(`描画: (${canvasPos.x.toFixed(0)}, ${canvasPos.y.toFixed(0)})`)
  }
  
  function clearCanvas() {
    if (!ctx) return
    
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    texture.needsUpdate = true
    
    updateDebug('Canvasクリア完了')
  }
  
  function calculateArea() {
    if (!ctx) return 0
    
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    const data = imageData.data
    
    let paintedPixels = 0
    
    // 青いピクセルをカウント（RGBAのB成分が0より大きい）
    for (let i = 2; i < data.length; i += 4) {
      if (data[i] > 0) { // Blue channel
        paintedPixels++
      }
    }
    
    const totalPixels = CANVAS_SIZE * CANVAS_SIZE
    const percentage = (paintedPixels / totalPixels) * 100
    
    return percentage
  }
  
  // タップ/クリックイベント
  function handleTap(event) {
    if (!drawingEnabled || !floorPlane) return
    
    // マウス/タッチ座標を取得
    const rect = sceneEl.canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // レイキャスティング
    const camera = sceneEl.camera
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    
    const intersects = raycaster.intersectObject(floorPlane)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      drawAtPosition(point)
    }
  }
  
  // イベントリスナー登録
  sceneEl.addEventListener('click', handleTap)
  sceneEl.addEventListener('touchstart', handleTap)
  
  // 初期化
  initCanvas()
  createFloorPlane()
  
  updateDebug('床面描画システム準備完了')
  
  // 公開API
  return {
    startDrawing: () => {
      drawingEnabled = true
      updateDebug('描画開始')
    },
    stopDrawing: () => {
      drawingEnabled = false
      updateDebug('描画停止')
    },
    resetDrawing: () => {
      clearCanvas()
      updateDebug('描画リセット')
    },
    getAreaPercentage: calculateArea,
    isDrawingEnabled: () => drawingEnabled
  }
}
