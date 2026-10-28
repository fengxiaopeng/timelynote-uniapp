<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { eventMonth, monthHeading } from '@/domain/feed-presentation'
import AnniversaryCard from './AnniversaryCard.vue'

const props = defineProps<{ items: Anniversary[], summary?: boolean }>()
const paging = ref<{
  clear: () => void
  pageReachBottom: () => void
  setLocalPaging: (data: Anniversary[]) => Promise<unknown>
} | null>(null)
const visible = ref<Anniversary[]>([])
const source = computed(() => props.summary ? props.items.slice(0, 5) : props.items)
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
    <view class="record-list event-record-list">
      <view v-for="(item, index) in visible" :key="item.id" class="record-list-item">
        <view v-if="!summary && (!index || eventMonth(item) !== eventMonth(visible[index - 1]))" class="record-group-heading">
          <text>{{ monthHeading(eventMonth(item)) }}</text><view class="record-group-line" />
        </view>
        <AnniversaryCard :event="item" />
      </view>
    </view>
  </z-paging>
</template>
