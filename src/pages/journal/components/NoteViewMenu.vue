<script setup lang="ts">
import type { NoteView } from '@/domain/note-views'
import { onHide } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { noteViews } from '@/domain/note-views'

const props = defineProps<{ modelValue: NoteView }>()
const emit = defineEmits<{ 'update:modelValue': [view: NoteView] }>()
const open = ref(false)
const current = computed(
  () => noteViews.find(view => view.id === props.modelValue) || noteViews[0],
)
function select(view: NoteView) {
  open.value = false
  emit('update:modelValue', view)
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    open.value = false
}
onHide(() => {
  open.value = false
})
// #ifdef H5
onMounted(() => document.addEventListener('keydown', keydown))
onUnmounted(() => document.removeEventListener('keydown', keydown))
// #endif
</script>

<template>
  <view class="note-view-switcher">
    <button
      role="button"
      class="note-view-trigger"
      :aria-label="`切换手记视图：${current.label}`"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <fg-journal-icon :name="current.icon" /><text>{{ current.label }}</text><text class="view-chevron">⌄</text>
    </button>
    <view
      v-if="open"
      class="note-view-dismiss"
      aria-hidden="true"
      @click="open = false"
    />
    <view
      v-if="open"
      class="paper note-view-menu"
      role="menu"
      aria-label="手记视图"
    >
      <button
        v-for="view in noteViews"
        :key="view.id"
        role="menuitemradio"
        :aria-checked="modelValue === view.id"
        class="note-view-option"
        @click="select(view.id)"
      >
        <fg-journal-icon :name="view.icon" /><text class="flex-1">
          {{ view.label }}
        </text><text v-if="modelValue === view.id" class="view-check">✓</text>
      </button>
    </view>
  </view>
</template>
