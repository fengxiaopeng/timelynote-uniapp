<script setup lang="ts">
import { chooseLocalPhotos } from '@/utils/journal-media'
import { toast } from '@/utils/journal-ui'

const props = withDefaults(
  defineProps<{ modelValue?: string[], label?: string }>(),
  { label: '添加照片' },
)
const emit = defineEmits<{ 'update:modelValue': [images: string[]] }>()
function remove(index: number) {
  emit(
    'update:modelValue',
    (props.modelValue || []).filter((_, i) => i !== index),
  )
}
function add() {
  chooseLocalPhotos(
    (images) => {
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
    },
    error => toast(error.message),
  )
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
    </view><button
      v-if="(modelValue?.length || 0) < 6"
      role="button"
      class="add-photo"
      @click="add"
    >
      <fg-journal-icon name="image" /><text>{{ label }}</text>
    </button>
  </view>
</template>
