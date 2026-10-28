<script setup lang="ts">
import { ref } from 'vue'
import { chooseLocalPhotos } from '@/utils/journal-media'
import { toast } from '@/utils/journal-ui'

const props = withDefaults(
  defineProps<{ modelValue?: string[], label?: string, camera?: boolean }>(),
  { label: '添加照片' },
)
const emit = defineEmits<{ 'update:modelValue': [images: string[]] }>()
const cameraOpen = ref(false)
function remove(index: number) {
  emit(
    'update:modelValue',
    (props.modelValue || []).filter((_, i) => i !== index),
  )
}
function append(images: string[]) {
  const next = [...(props.modelValue || []), ...images]
  if (next.length > 6) {
    toast('最多保留 6 张照片')
    return
  }
  if (next.join('').length > 2500000) {
    toast('照片较多，请减少照片后重试')
    return
  }
  emit('update:modelValue', next)
}
function add() {
  chooseLocalPhotos(append, error => toast(error.message), {
    source: 'album',
  })
}
function takePhoto() {
  // 触屏设备直接交给系统拍摄；桌面浏览器保留可用摄像头预览。
  // #ifdef H5
  if (window.matchMedia('(any-pointer: coarse)').matches) {
    chooseLocalPhotos(append, error => toast(error.message), {
      source: 'camera',
      multiple: false,
    })
    return
  }
  // #endif
  cameraOpen.value = true
}
function captured(image: string) {
  append([image])
  cameraOpen.value = false
}
</script>

<template>
  <view class="photo-picker my-5">
    <view
      v-for="(src, index) in modelValue || []"
      :key="index"
      class="photo-preview"
    >
      <image :src="src" mode="aspectFill" /><button
        role="button"
        class="photo-remove"
        :aria-label="`移除第 ${index + 1} 张照片`"
        @click="remove(index)"
      >
        ×
      </button>
    </view><view v-if="(modelValue?.length || 0) < 6" class="photo-actions">
      <button role="button" class="add-photo" @click="add">
        <fg-journal-icon name="image" /><text>{{ label }}</text>
      </button><button
        v-if="camera"
        role="button"
        class="add-photo"
        @click="takePhoto"
      >
        <fg-journal-icon name="camera" /><text>拍一张照片</text>
      </button>
    </view>
  </view>
  <fg-camera-capture
    v-if="cameraOpen"
    @captured="captured"
    @close="cameraOpen = false"
  />
</template>
