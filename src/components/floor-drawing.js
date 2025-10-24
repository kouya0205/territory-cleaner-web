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
  
  // デバッグ情報を画面に表示
  function updateDebug(msg) {
    if (debugEl) debugEl.textContent = msg
    console.log('DEBUG:', msg) // コンソールにも出力
  }
  
  // 詳細なデバッグ情報を画面に表示（簡潔版）
  function showDebugInfo(title, data) {
    const timestamp = new Date().toLocaleTimeString()
    // 重要な情報のみ表示
    const shortData = {
      source: data.source,
      enabled: data.drawingEnabled,
      plane: data.floorPlane,
      type: data.eventType,
      x: data.clientX,
      y: data.clientY
    }
    const debugMsg = `[${timestamp}] ${title}: ${JSON.stringify(shortData)}`
    updateDebug(debugMsg)
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
    
    // 大きな床面を作成（4m x 4m）- サイズを拡大
    const geometry = new THREE.PlaneGeometry(4, 4)
    floorPlane = new THREE.Mesh(geometry, material)
    
    // 床面を水平に配置（Y=-0.5）- カメラの下に配置
    floorPlane.rotation.x = -Math.PI / 2  // 90度回転して水平に
    floorPlane.position.y = -0.5
    floorPlane.position.z = -2  // カメラの前方に配置
    
    // 床面の向きを確認
    updateDebug('床面向き: ' + JSON.stringify({
      rotation: { x: floorPlane.rotation.x.toFixed(3), y: floorPlane.rotation.y.toFixed(3), z: floorPlane.rotation.z.toFixed(3) },
      position: { x: floorPlane.position.x.toFixed(3), y: floorPlane.position.y.toFixed(3), z: floorPlane.position.z.toFixed(3) }
    }))
    
    // 床面を可視化するため、一時的に色を変更
    floorPlane.material.color.setHex(0xff0000) // 赤色で可視化
    floorPlane.material.opacity = 0.3
    floorPlane.material.transparent = true
    
    // シーンに追加
    const scene = sceneEl.object3D
    scene.add(floorPlane)
    
    const floorInfo = {
      source: 'floor',
      enabled: true,
      plane: true,
      type: 'created',
      x: floorPlane.position.x,
      y: floorPlane.position.y,
      z: floorPlane.position.z
    }
    showDebugInfo('✅ 床面作成完了', floorInfo)
    
    // 床面の境界ボックスを計算
    floorPlane.geometry.computeBoundingBox()
    const bbox = floorPlane.geometry.boundingBox
    updateDebug('床面境界: ' + JSON.stringify({
      min: { x: bbox.min.x, y: bbox.min.y, z: bbox.min.z },
      max: { x: bbox.max.x, y: bbox.max.y, z: bbox.max.z }
    }))
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
    if (!ctx || !drawingEnabled) {
      updateDebug('❌ 描画条件不満足: ctx=' + !!ctx + ', drawingEnabled=' + drawingEnabled)
      return
    }
    
    const canvasPos = worldToCanvas(worldPos)
    if (!canvasPos) {
      updateDebug('❌ Canvas座標変換失敗: ' + JSON.stringify({ x: worldPos.x.toFixed(3), y: worldPos.y.toFixed(3), z: worldPos.z.toFixed(3) }))
      return
    }
    
    const drawInfo = {
      source: 'draw',
      enabled: true,
      plane: true,
      type: 'execute',
      x: canvasPos.x.toFixed(0),
      y: canvasPos.y.toFixed(0)
    }
    showDebugInfo('🎨 描画実行', drawInfo)
    
    // 青い円を描画
    ctx.fillStyle = '#3b82f6' // 青
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, BRUSH_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Texture更新
    texture.needsUpdate = true
    
    updateDebug('✅ 描画完了: (' + canvasPos.x.toFixed(0) + ', ' + canvasPos.y.toFixed(0) + ')')
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
    // イベントの発生源を特定
    const eventSource = event.target.id || event.target.tagName || 'unknown'
    
    const tapInfo = {
      source: eventSource,
      drawingEnabled,
      floorPlane: !!floorPlane,
      eventType: event.type,
      clientX: event.clientX,
      clientY: event.clientY
    }
    showDebugInfo('🎯 タップイベント発生', tapInfo)
    
    // 描画状態の詳細チェック
    if (!drawingEnabled) {
      updateDebug('❌ 描画が無効 - drawingEnabled=' + drawingEnabled + ', floorPlane=' + !!floorPlane)
      return
    }
    
    if (!floorPlane) {
      updateDebug('❌ 床面が未作成 - floorPlane=' + !!floorPlane)
      return
    }
    
    // 床面の詳細情報を表示
    const floorDetails = {
      position: { x: floorPlane.position.x, y: floorPlane.position.y, z: floorPlane.position.z },
      rotation: { x: floorPlane.rotation.x, y: floorPlane.rotation.y, z: floorPlane.rotation.z },
      visible: floorPlane.visible
    }
    updateDebug('床面詳細: ' + JSON.stringify(floorDetails))
    
    // マウス/タッチ座標を取得
    const rect = sceneEl.canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    const coordInfo = {
      source: 'coord',
      enabled: true,
      plane: true,
      type: 'transform',
      x: x.toFixed(3),
      y: y.toFixed(3)
    }
    showDebugInfo('📐 座標変換', coordInfo)
    
    // レイキャスティング
    const camera = sceneEl.camera
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    
    // カメラとレイの詳細情報を表示
    const cameraInfo = {
      position: { x: camera.position.x.toFixed(3), y: camera.position.y.toFixed(3), z: camera.position.z.toFixed(3) },
      rotation: { x: camera.rotation.x.toFixed(3), y: camera.rotation.y.toFixed(3), z: camera.rotation.z.toFixed(3) }
    }
    updateDebug('カメラ詳細: ' + JSON.stringify(cameraInfo))
    
    // レイの方向と原点を表示
    const rayOrigin = raycaster.ray.origin
    const rayDirection = raycaster.ray.direction
    updateDebug('レイ詳細: ' + JSON.stringify({
      origin: { x: rayOrigin.x.toFixed(3), y: rayOrigin.y.toFixed(3), z: rayOrigin.z.toFixed(3) },
      direction: { x: rayDirection.x.toFixed(3), y: rayDirection.y.toFixed(3), z: rayDirection.z.toFixed(3) }
    }))
    
    // 複数の方法でレイキャスティングを試行
    const intersects1 = raycaster.intersectObject(floorPlane)
    const intersects2 = raycaster.intersectObjects([floorPlane])
    
    // 床面のワールド座標での境界を計算
    floorPlane.updateMatrixWorld()
    const worldMatrix = floorPlane.matrixWorld
    updateDebug('床面ワールド行列: ' + JSON.stringify({
      position: { x: worldMatrix.elements[12].toFixed(3), y: worldMatrix.elements[13].toFixed(3), z: worldMatrix.elements[14].toFixed(3) }
    }))
    
    const raycastInfo = {
      source: 'raycast',
      enabled: true,
      plane: true,
      type: 'intersect',
      x: intersects1.length,
      y: intersects2.length,
      method1: intersects1.length,
      method2: intersects2.length
    }
    showDebugInfo('🔍 レイキャスティング結果', raycastInfo)
    
    // レイの詳細情報も表示
    if (intersects1.length > 0) {
      const intersect = intersects1[0]
      updateDebug('交点詳細: ' + JSON.stringify({
        point: { x: intersect.point.x.toFixed(3), y: intersect.point.y.toFixed(3), z: intersect.point.z.toFixed(3) },
        distance: intersect.distance.toFixed(3),
        face: intersect.face ? 'あり' : 'なし'
      }))
    } else {
      updateDebug('❌ レイキャスティング失敗 - 床面との交点なし')
    }
    
    const intersects = intersects1.length > 0 ? intersects1 : intersects2
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      const hitInfo = {
        source: 'hit',
        enabled: true,
        plane: true,
        type: 'found',
        x: point.x.toFixed(3),
        y: point.y.toFixed(3)
      }
      showDebugInfo('✅ 床面との交点発見', hitInfo)
      drawAtPosition(point)
    } else {
      updateDebug('❌ 床面との交点なし')
    }
  }
  
  // イベントリスナー登録
  sceneEl.addEventListener('click', handleTap)
  sceneEl.addEventListener('touchstart', handleTap)
  
  // DOM Overlay用のイベントリスナーも追加
  const overlayEl = document.getElementById('ar-overlay')
  if (overlayEl) {
    // DOM Overlayのボタン部分のみにイベントリスナーを追加
    const buttonArea = overlayEl.querySelector('div:last-child')
    if (buttonArea) {
      buttonArea.addEventListener('click', handleTap)
      buttonArea.addEventListener('touchstart', handleTap)
      updateDebug('✅ DOM Overlayボタンエリアにイベントリスナー追加')
    } else {
      // ボタンエリアが見つからない場合は全体に追加
      overlayEl.addEventListener('click', handleTap)
      overlayEl.addEventListener('touchstart', handleTap)
      updateDebug('✅ DOM Overlay全体にイベントリスナー追加')
    }
  } else {
    updateDebug('⚠️ DOM Overlay要素が見つからない')
  }
  
  // 追加: 画面全体にタッチイベントを追加（AR中は全画面なので）
  document.addEventListener('click', handleTap)
  document.addEventListener('touchstart', handleTap)
  updateDebug('✅ 画面全体にイベントリスナー追加')
  
  // 初期化
  initCanvas()
  createFloorPlane()
  
  // ARセッション開始時に床面の位置を調整
  const adjustFloorPosition = () => {
    if (!floorPlane) return
    
    // カメラの位置に基づいて床面の位置を調整
    const camera = sceneEl.camera
    if (camera) {
      // カメラの下1.5m、前方2mの位置に床面を配置
      floorPlane.position.x = camera.position.x
      floorPlane.position.y = camera.position.y - 1.5
      floorPlane.position.z = camera.position.z - 2
      
      updateDebug('床面位置調整: ' + JSON.stringify({
        camera: { x: camera.position.x.toFixed(3), y: camera.position.y.toFixed(3), z: camera.position.z.toFixed(3) },
        floor: { x: floorPlane.position.x.toFixed(3), y: floorPlane.position.y.toFixed(3), z: floorPlane.position.z.toFixed(3) }
      }))
    }
  }
  
  // ARセッション開始時に床面位置を調整
  sceneEl.addEventListener('enter-vr', adjustFloorPosition)
  
  updateDebug('床面描画システム準備完了')
  
  // 公開API
  return {
    startDrawing: () => {
      drawingEnabled = true
      const startInfo = { 
        source: 'start', 
        enabled: drawingEnabled, 
        plane: !!floorPlane, 
        type: 'drawing', 
        x: 0, 
        y: 0 
      }
      showDebugInfo('🎨 描画開始', startInfo)
      
      // 描画状態を確認
      setTimeout(() => {
        updateDebug('描画状態確認: drawingEnabled=' + drawingEnabled + ', floorPlane=' + !!floorPlane)
      }, 100)
    },
    stopDrawing: () => {
      drawingEnabled = false
      updateDebug('⏹️ 描画停止: drawingEnabled=' + drawingEnabled)
    },
    resetDrawing: () => {
      clearCanvas()
      updateDebug('🔄 描画リセット')
    },
    getAreaPercentage: calculateArea,
    isDrawingEnabled: () => drawingEnabled
  }
}
