<script setup lang="ts">
import { navigate } from '@/utils/journal-ui'
import type { Note } from '@/domain/journal'

defineProps<{
  note: Note
}>()
</script>

<template>
  <button
    role="button"
    class="paper note-card"
    @click="
      navigate({
        url: `/pages/journal/note-detail?id=${encodeURIComponent(note.id)}`,
      })
    "
  >
    <view class="flex items-start justify-between gap-3">
      <view class="card-title">
        {{ note.title || "一页日常" }}
      </view><text class="muted shrink-0 text-3">
        {{
          note.date.slice(5).replace("-", "/")
        }}
      </text>
    </view>
    <view class="note-excerpt">
      {{ note.content }}
    </view>
    <view v-if="note.images.length" class="note-thumbnails">
      <image
        v-for="(src, index) in note.images.slice(0, 3)"
        :key="index"
        :src="src"
        mode="aspectFill"
      /><text v-if="note.images.length > 3" class="more-images">
        +{{ note.images.length - 3 }}
      </text>
    </view>
    <view v-else-if="note.id === 'sample-sea'" class="note-thumbnails">
      <view class="photo--sea" /><view class="photo--dusk" /><view
        class="photo--room"
      />
    </view>
    <view
      v-if="note.place || note.weather"
      class="muted mt-3 flex flex-wrap items-center gap-2 text-3"
    >
      <fg-journal-icon v-if="note.place" name="pin" />{{ note.place }}
      <text>{{ note.weather }}</text>
    </view>
    <view
      v-if="note.tags.length || note.sample"
      class="mt-3 flex flex-wrap gap-2"
    >
      <text v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</text><text v-if="note.sample" class="sample-label">示例</text>
    </view>
  </button>
</template>
