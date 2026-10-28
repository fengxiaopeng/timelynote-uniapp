<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { noteDayLabel } from '@/domain/feed-presentation'
import NoteCard from './NoteCard.vue'

const props = defineProps<{ items: Note[], summary?: boolean }>()
const paging = ref<{
  clear: () => void
  pageReachBottom: () => void
  setLocalPaging: (data: Note[]) => Promise<unknown>
} | null>(null)
const visible = ref<Note[]>([])
const source = computed(() => props.summary ? props.items.slice(0, 1) : props.items)
onReachBottom(() => {
  if (!props.summary)
    paging.value?.pageReachBottom()
})
watch(
  [source, paging],
  () => {
    if (paging.value) {
      paging.value.clear()
      void paging.value.setLocalPaging(source.value)
    }
  },
  { immediate: true },
)
</script>

<template>
  <z-paging
    ref="paging"
    v-model="visible"
    :fixed="false"
    :auto="false"
    :auto-full-height="false"
    :loading-more-enabled="!summary"
    :use-page-scroll="true"
    :default-page-size="summary ? 5 : 20"
    :refresher-enabled="false"
    :hide-empty-view="true"
    :show-loading-more-no-more-view="false"
  >
    <view class="record-list note-record-list">
      <view v-for="(item, index) in visible" :key="item.id" class="record-list-item">
        <view v-if="!summary && (!index || item.date !== visible[index - 1].date)" class="record-group-heading" :class="{ 'record-group-recent': noteDayLabel(item.date).startsWith('今天') || noteDayLabel(item.date).startsWith('昨天') }">
          <text>{{ noteDayLabel(item.date) }}</text><view class="record-group-line" />
        </view>
        <NoteCard :note="item" :compact="summary" />
      </view>
    </view>
  </z-paging>
</template>
