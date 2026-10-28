/** 相册与相机共用压缩规则，持久化的图片统一为 JPEG data URL。 */
export function encodePhotoFrame(
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  if (!width || !height)
    throw new Error('画面还在准备中，请稍后再拍')
  const scale = Math.min(1, 1200 / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext('2d')
  if (!context)
    throw new Error('当前浏览器无法处理图片')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.72)
}

/** H5 图片转换为压缩 data URL，刷新后仍能显示；所有浏览器 API 位于平台接缝。 */
export function chooseLocalPhotos(
  onResult: (images: string[]) => void,
  onError: (error: Error) => void,
  options: { source?: 'album' | 'camera', multiple?: boolean } = {},
) {
  // #ifdef H5
  const picker = document.createElement('input')
  picker.type = 'file'
  picker.accept = 'image/jpeg,image/png,image/webp'
  picker.multiple = options.multiple ?? options.source !== 'camera'
  if (options.source === 'camera')
    picker.setAttribute('capture', 'environment')
  picker.onchange = async () => {
    try {
      const files = Array.from(picker.files || [])
      if (files.length > 6)
        throw new Error('一篇手记最多选择 6 张照片')
      const images: string[] = []
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
          throw new Error('请选择 JPG、PNG 或 WebP 图片')
        if (file.size > 15 * 1024 * 1024)
          throw new Error('单张照片请小于 15 MB')
        const url = URL.createObjectURL(file)
        try {
          const img = new Image()
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('照片读取失败，请重新选择'))
            img.src = url
          })
          images.push(encodePhotoFrame(img, img.width, img.height))
        }
        finally {
          URL.revokeObjectURL(url)
        }
      }
      onResult(images)
    }
    catch (error) {
      onError(error as Error)
    }
  }
  picker.click()
  // #endif
  // #ifndef H5
  onError(new Error('当前首版仅支持在 H5 选择照片'))
  // #endif
}
