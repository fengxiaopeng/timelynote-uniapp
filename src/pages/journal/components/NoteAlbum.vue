<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { onReachBottom } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import NoteAlbumCard from './NoteAlbumCard.vue'

const props = defineProps<{ notes: Note[] }>()
const paging = ref<{
  clear: () => void
  pageReachBottom: () => void
  setLocalPaging: (notes: Note[]) => Promise<unknown>
} | null>(null)
const visible = ref<Note[]>([])
const source = computed(() => props.notes)
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
onReachBottom(() => paging.value?.pageReachBottom())
</script>

<template>
  <view class="note-album">
    <z-paging
      ref="paging"
      v-model="visible"
      :fixed="false"
      :auto="false"
      :use-page-scroll="true"
      :default-page-size="10"
      :refresher-enabled="false"
      :hide-empty-view="true"
      :show-loading-more-no-more-view="false"
    >
      <NoteAlbumCard
        v-for="note in visible"
        :key="note.id"
        :note="note"
      />
    </z-paging><view v-if="!notes.length" class="small-empty serif">
      一张照片，一段日常。<br>下一次想记住的瞬间，就留在这里。
    </view>
  </view>
</template>
