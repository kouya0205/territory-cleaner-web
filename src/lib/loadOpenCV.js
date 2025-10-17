// OpenCV.js を動的に読み込むユーティリティ
// 返り値: Promise<cv>

const OPENCV_CDN = 'https://docs.opencv.org/4.x/opencv.js'

export function loadOpenCV() {
  if (typeof window === 'undefined') return Promise.reject(new Error('window is undefined'))

  if (window.cv && typeof window.cv === 'object') {
    return Promise.resolve(window.cv)
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-opencv]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.cv))
      existing.addEventListener('error', () => reject(new Error('Failed to load OpenCV.js')))
      return
    }

    const script = document.createElement('script')
    script.src = OPENCV_CDN
    script.async = true
    script.defer = true
    script.dataset.opencv = 'true'
    script.addEventListener('load', () => {
      if (window.cv) {
        resolve(window.cv)
      } else {
        reject(new Error('OpenCV.js loaded but cv is undefined'))
      }
    })
    script.addEventListener('error', () => reject(new Error('Failed to load OpenCV.js')))
    document.head.appendChild(script)
  })
}


