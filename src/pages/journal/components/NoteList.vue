<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import NoteCard from './NoteCard.vue'

const props = defineProps<{ items: Note[], summary?: boolean }>()
const paging = ref<{
  pageReachBottom: () => void
  setLocalPaging: (data: Note[]) => Promise<unknown>
} | null>(null)
const visible = ref<Note[]>([])
const source = computed(() => props.summary ? props.items.slice(0, 5) : props.items)
onReachBottom(() => {
  if (!props.summary)
    paging.value?.pageReachBottom()
})
watch(
  [source, paging],
  () => {
    if (paging.value)
      void paging.value.setLocalPaging(source.value)
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
    :loading-more-enabled="!summary"
    :use-page-scroll="true"
    :default-page-size="summary ? 5 : 20"
    :refresher-enabled="false"
    :hide-empty-view="true"
    :show-loading-more-no-more-view="false"
  >
    <view class="timeline">
      <view v-for="item in visible" :key="item.id" class="timeline-item">
        <view class="timeline-node past-node">
          <fg-journal-icon name="pen" />
        </view>
        <NoteCard :note="item" />
      </view>
    </view>
  </z-paging>
</template>
