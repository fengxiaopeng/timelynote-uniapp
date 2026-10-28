import { encodePhotoFrame } from './journal-media'

export interface CameraSession {
  video: HTMLVideoElement
  capture: () => string
  stop: () => void
}
/** 只从 H5 条件编译分支调用，音频始终关闭。 */
export async function startCamera(
  signal?: AbortSignal,
  host?: HTMLElement,
): Promise<CameraSession> {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error('当前浏览器无法预览相机，请使用系统相机')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  })
  const video = document.createElement('video')
  let stopped = false
  function stop() {
    if (stopped)
      return
    stopped = true
    signal?.removeEventListener('abort', stop)
    stream.getTracks().forEach(track => track.stop())
    video.pause()
    video.srcObject = null
    video.remove()
  }
  if (signal?.aborted) {
    stop()
    throw new DOMException('Camera closed', 'AbortError')
  }
  signal?.addEventListener('abort', stop, { once: true })
  try {
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.srcObject = stream
    host?.appendChild(video)
    await video.play()
    if (signal?.aborted)
      throw new DOMException('Camera closed', 'AbortError')
  }
  catch (error) {
    stop()
    throw error
  }
  return {
    video,
    capture() {
      if (stopped)
        throw new Error('相机已关闭，请重新打开')
      return encodePhotoFrame(video, video.videoWidth, video.videoHeight)
    },
    stop,
  }
}
export function cameraErrorMessage(error: unknown) {
  // DOMException 可能来自另一执行上下文，不能依赖 instanceof Error。
  const cause = typeof error === 'object' && error !== null ? error as { name?: unknown, message?: unknown } : {}
  if (cause.name === 'NotAllowedError')
    return '相机权限未开启，请允许访问后重试，或使用系统相机'
  if (cause.name === 'NotFoundError')
    return '没有检测到可用相机，请使用系统相机'
  if (cause.name === 'NotReadableError')
    return '相机正被占用，请关闭其他相机应用后重试'
  return typeof cause.message === 'string' ? cause.message : '无法打开相机，请重试或使用系统相机'
}
