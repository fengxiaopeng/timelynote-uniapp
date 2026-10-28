<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { shortDate } from '@/domain/note-views'
import { navigate, previewImage } from '@/utils/journal-ui'

const props = defineProps<{ note: Note }>()
const index = ref(0)
let changedAt = 0
let origin: { x: number, y: number } | null = null
let moved = false
function point(event: TouchEvent | MouseEvent) {
  if ('touches' in event && event.touches.length)
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  if ('clientX' in event)
    return { x: event.clientX, y: event.clientY }
  return null
}
function begin(event: TouchEvent | MouseEvent) {
  origin = point(event)
  moved = false
}
function move(event: TouchEvent | MouseEvent) {
  const next = point(event)
  if (
    origin
    && next
    && (Math.abs(next.x - origin.x) > 8 || Math.abs(next.y - origin.y) > 8)
  ) {
    moved = true
  }
}
function changeImage(next: number) {
  if (next !== index.value)
    changedAt = Date.now()
  index.value = next
}
function preview(src: string) {
  if (moved || Date.now() - changedAt < 450)
    return
  previewImage({ urls: props.note.images, current: src })
}
const sampleFrames = computed(() =>
  props.note.sample
  && props.note.id === 'sample-sea'
  && !props.note.images.length
    ? ['photo--sea', 'photo--dusk', 'photo--room']
    : [],
)
const count = computed(
  () => props.note.images.length || sampleFrames.value.length,
)
watch(
  () => props.note.images,
  () => {
    index.value = 0
  },
)
function detail() {
  navigate({
    url: `/pages/journal/note-detail?id=${encodeURIComponent(props.note.id)}`,
  })
}
</script>

<template>
  <view class="album-note" :class="{ 'album-note-text': !count }">
    <view
      v-if="count"
      class="album-media"
      @touchstart.capture="begin"
      @touchmove.capture="move"
      @mousedown.capture="begin"
      @mousemove.capture="move"
    >
      <swiper
        class="album-swiper"
        :current="index"
        :circular="count > 1"
        :autoplay="false"
        @change="changeImage(Number($event.detail.current))"
      >
        <swiper-item v-for="(src, photoIndex) in note.images" :key="photoIndex">
          <image
            :src="src"
            class="album-photo"
            mode="aspectFill"
            :aria-label="`${note.title || '手记照片'}，第 ${photoIndex + 1} 张`"
            @click="preview(src)"
          />
        </swiper-item><swiper-item v-for="frame in sampleFrames" :key="frame">
          <view class="album-photo" :class="frame">
            <text class="album-sample-label">示例画面</text>
          </view>
        </swiper-item>
      </swiper><text v-if="count > 1" class="album-counter">
        {{ index + 1 }}/{{ count }}
      </text>
    </view>
    <view v-if="count > 1" class="album-dots" aria-hidden="true">
      <view
        v-for="position in count"
        :key="position"
        class="album-dot"
        :class="{ active: position - 1 === index }"
      />
    </view>
    <button role="button" class="album-caption" @click="detail">
      <view class="album-date">
        {{ shortDate(note.date)
        }}<text v-if="note.sample" class="sample-label ml-2">示例</text><fg-journal-icon v-if="!count" name="pen" />
      </view><view class="album-title">
        {{ note.title || "一页日常" }}
      </view><view class="album-excerpt">
        {{ note.content || "把这一刻，留在照片里。" }}
      </view>
    </button>
  </view>
</template>
