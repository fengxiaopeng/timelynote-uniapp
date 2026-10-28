import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cameraErrorMessage, startCamera } from './journal-camera.h5'

const stopTrack = vi.fn()
const getUserMedia = vi.fn()
beforeEach(() => {
  stopTrack.mockClear()
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] })
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})
describe('h5 相机生命周期', () => {
  it('只请求视频，关闭时停止相机并移除视频元素，重复关闭也安全', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const camera = await startCamera(undefined, host)
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    expect(host.contains(camera.video)).toBe(true)
    camera.stop()
    camera.stop()
    expect(stopTrack).toHaveBeenCalledTimes(1)
    expect(host.children).toHaveLength(0)
    expect(() => camera.capture()).toThrow('相机已关闭')
    host.remove()
  })
  it('等待权限期间取消，迟到的相机也立即关闭', async () => {
    let resolveStream!: (value: {
      getTracks: () => { stop: () => void }[]
    }) => void
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStream = resolve
        }),
    )
    const controller = new AbortController()
    const opening = startCamera(controller.signal)
    controller.abort()
    resolveStream({ getTracks: () => [{ stop: stopTrack }] })
    await expect(opening).rejects.toMatchObject({ name: 'AbortError' })
    expect(stopTrack).toHaveBeenCalledTimes(1)
  })
  it('播放失败也关闭相机，权限错误显示明确提示', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new Error('play failed'),
    )
    await expect(startCamera()).rejects.toThrow('play failed')
    expect(stopTrack).toHaveBeenCalledTimes(1)
    expect(
      cameraErrorMessage(new DOMException('denied', 'NotAllowedError')),
    ).toContain('权限未开启')
  })
})
