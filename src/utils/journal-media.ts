/** H5 图片转换为压缩 data URL，刷新后仍能显示；所有浏览器 API 位于平台接缝。 */
export function chooseLocalPhotos(
  onResult: (images: string[]) => void,
  onError: (error: Error) => void,
) {
  // #ifdef H5
  const picker = document.createElement('input')
  picker.type = 'file'
  picker.accept = 'image/jpeg,image/png,image/webp'
  picker.multiple = true
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
          const scale = Math.min(1, 1200 / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          if (!ctx)
            throw new Error('当前浏览器无法处理图片')
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          images.push(canvas.toDataURL('image/jpeg', 0.72))
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
