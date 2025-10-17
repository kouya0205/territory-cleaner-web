// OpenCVを使ってカメラフレームから指定色のマーカーを追跡
// 入力: videoElement, cv, colorPreset
// 出力: { x, y } (画像座標、正規化0-1) or null

export function trackMarker(videoElement, cv, colorPreset) {
  if (!videoElement || !cv || !colorPreset) return null

  const width = videoElement.videoWidth
  const height = videoElement.videoHeight
  if (width === 0 || height === 0) return null

  // videoをMatに変換
  const src = new cv.Mat(height, width, cv.CV_8UC4)
  const cap = new cv.VideoCapture(videoElement)
  cap.read(src)

  // BGRに変換してHSVへ
  const bgr = new cv.Mat()
  cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR)
  const hsv = new cv.Mat()
  cv.cvtColor(bgr, hsv, cv.COLOR_BGR2HSV)

  // 色域でマスク
  const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), colorPreset.lower)
  const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), colorPreset.upper)
  const mask = new cv.Mat()
  cv.inRange(hsv, lower, upper, mask)

  // モルフォロジー演算でノイズ除去
  const kernel = cv.Mat.ones(5, 5, cv.CV_8U)
  cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel)
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel)

  // 輪郭抽出
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

  let result = null
  if (contours.size() > 0) {
    // 最大面積の輪郭を選択
    let maxArea = 0
    let maxIdx = -1
    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i))
      if (area > maxArea) {
        maxArea = area
        maxIdx = i
      }
    }
    if (maxIdx >= 0 && maxArea > 100) {
      const M = cv.moments(contours.get(maxIdx))
      if (M.m00 !== 0) {
        const cx = M.m10 / M.m00
        const cy = M.m01 / M.m00
        result = { x: cx / width, y: cy / height }
      }
    }
  }

  // メモリ解放
  src.delete()
  bgr.delete()
  hsv.delete()
  lower.delete()
  upper.delete()
  mask.delete()
  kernel.delete()
  contours.delete()
  hierarchy.delete()

  return result
}

// 蛍光ピンクのプリセット（HSV）
export const COLOR_PRESETS = {
  fluorescent_pink: {
    name: '蛍光ピンク',
    lower: [140, 100, 100],
    upper: [170, 255, 255],
  },
  // 追加の色プリセットをここに定義可能
  green: {
    name: '緑',
    lower: [40, 70, 70],
    upper: [80, 255, 255],
  },
}

