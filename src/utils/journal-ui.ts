export function toast(message: string) {
  uni.showToast({ title: message, icon: 'none', duration: 2400 })
}
export function back() {
  if (getCurrentPages().length > 1)
    uni.navigateBack()
  else
    uni.reLaunch({ url: '/pages/index/index' })
}
export async function confirmAction(title: string, content: string) {
  const result = await uni.showModal({ title, content, confirmColor: '#b44232', confirmText: '确定', cancelText: '取消' })
  return result.confirm
}
export function navigate(options: {
  url: string
}) {
  uni.navigateTo(options)
}
export function switchTab(options: {
  url: string
}) {
  uni.switchTab(options)
}
export function previewImage(options: {
  urls: string[]
  current: string
}) {
  uni.previewImage(options)
}

/** 取消菜单不触发任何操作。删除仍由各用例单独确认。 */
export async function chooseAction(items: string[]) {
  const result = await uni.showActionSheet({ itemList: items }).catch(() => null)
  return result?.tapIndex ?? null
}
