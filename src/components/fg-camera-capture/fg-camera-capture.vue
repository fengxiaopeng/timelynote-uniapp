<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { chooseLocalPhotos } from '@/utils/journal-media'
import { toast } from '@/utils/journal-ui'
// #ifdef H5
import type { CameraSession } from '@/utils/journal-camera.h5'
import { cameraErrorMessage, startCamera } from '@/utils/journal-camera.h5'

// #endif
const emit = defineEmits<{ captured: [image: string], close: [] }>()
let session: CameraSession | null = null
let controller: AbortController | null = null
const hostId = `camera-preview-${Math.random().toString(36).slice(2)}`
const loading = ref(true)
const error = ref('')
let disposed = false
let opening = false
function stop() {
  // #ifdef H5
  controller?.abort()
  controller = null
  session?.stop()
  session = null
  // #endif
}
async function start() {
  if (opening || disposed)
    return
  opening = true
  error.value = ''
  loading.value = true
  // #ifdef H5
  try {
    await nextTick()
    const host = document.getElementById(hostId)
    if (!host || disposed)
      return
    controller = new AbortController()
    const opened = await startCamera(controller.signal, host)
    if (disposed) {
      opened.stop()
      return
    }
    session = opened
  }
  catch (cause) {
    if (!disposed)
      error.value = cameraErrorMessage(cause)
  }
  finally {
    opening = false
    loading.value = false
  }
  // #endif
  // #ifndef H5
  error.value = '当前版本请在 H5 中拍照'
  opening = false
  loading.value = false
  // #endif
}
function close() {
  disposed = true
  stop()
  emit('close')
}
function capture() {
  // #ifdef H5
  try {
    const image = session?.capture()
    if (image) {
      stop()
      emit('captured', image)
    }
  }
  catch (cause) {
    toast(cameraErrorMessage(cause))
  }
  // #endif
}
function systemCamera() {
  chooseLocalPhotos(
    (images) => {
      if (images[0]) {
        stop()
        emit('captured', images[0])
      }
    },
    cause => toast(cause.message),
    { source: 'camera', multiple: false },
  )
}
onMounted(start)
onUnmounted(() => {
  disposed = true
  stop()
})
</script>

<template>
  <view
    class="modal-overlay camera-overlay"
    role="dialog"
    aria-label="拍一张照片"
    @click.self="close"
  >
    <view class="paper modal-panel camera-panel">
      <view class="flex items-center justify-between">
        <text class="serif text-6">拍一张照片</text><button
          role="button"
          class="icon-button"
          aria-label="关闭相机"
          @click="close"
        >
          ×
        </button>
      </view><view class="camera-preview mt-4">
        <view :id="hostId" class="camera-video-host" />
        <view v-if="loading" class="camera-message">
          正在打开相机…
        </view><view v-else-if="error" class="camera-message">
          {{ error }}
        </view>
      </view><view v-if="error" class="mt-4 flex gap-3">
        <button role="button" class="outline-button flex-1" @click="start">
          重试
        </button><button
          role="button"
          class="primary-button flex-1"
          @click="systemCamera"
        >
          使用系统相机
        </button>
      </view><button
        v-else
        role="button"
        class="primary-button mt-4"
        :disabled="loading"
        @click="capture"
      >
        拍摄并使用
      </button>
    </view>
  </view>
</template>
