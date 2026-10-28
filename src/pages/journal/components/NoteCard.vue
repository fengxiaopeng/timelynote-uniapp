<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { computed } from 'vue'
import { navigate } from '@/utils/journal-ui'

const props = defineProps<{ note: Note, compact?: boolean }>()
const sample = computed(() => !props.note.images.length && props.note.sample && props.note.id === 'sample-sea')
</script>

<template>
  <button role="button" class="paper note-card" :class="{ 'note-card-compact': compact }" @click="navigate({ url: `/pages/journal/note-detail?id=${encodeURIComponent(note.id)}` })">
    <view class="card-title-row">
      <view class="card-title">
        {{ note.title || '一页日常' }}
      </view><text class="card-date note-card-date">{{ note.date.slice(5).replace('-', '/') }}</text>
    </view>
    <view v-if="note.content" class="note-excerpt">
      {{ note.content }}
    </view>
    <view v-if="note.images.length" class="note-gallery" :class="{ 'note-gallery-single': note.images.length === 1, 'note-gallery-pair': note.images.length === 2, 'note-gallery-grid': note.images.length >= 3 }">
      <view v-for="(src, index) in note.images.slice(0, 3)" :key="index" class="note-photo-cell">
        <image :src="src" mode="aspectFill" :aria-label="`${note.title || '手记'}，第 ${index + 1} 张照片`" />
        <text v-if="index === 2 && note.images.length > 3" class="more-images">+{{ note.images.length - 3 }}</text>
      </view>
    </view>
    <view v-else-if="sample" class="note-gallery note-gallery-grid">
      <view class="note-photo-cell photo--sea" /><view class="note-photo-cell photo--dusk" /><view class="note-photo-cell photo--room" />
    </view>
    <view v-if="note.place" class="card-place">
      <fg-journal-icon name="pin" /><text>{{ note.place }}</text>
    </view>
    <view v-if="note.tags.length || note.sample || note.personIds?.length" class="card-footer">
      <view class="card-tags">
        <text v-for="tag in note.tags.slice(0, 3)" :key="tag" class="note-tag">{{ tag }}</text>
        <text v-if="note.tags.length > 3" class="card-tag-more">+{{ note.tags.length - 3 }}</text>
        <text v-if="note.sample" class="sample-label">示例</text>
      </view>
      <fg-person-tags :ids="note.personIds" compact />
    </view>
  </button>
</template>
