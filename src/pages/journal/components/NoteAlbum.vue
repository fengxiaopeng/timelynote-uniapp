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
const source = computed(() => props.notes.filter(note => note.images.length > 0))
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
    </z-paging><view v-if="!source.length" class="small-empty serif">
      还没有带照片的手记。<br>为手记添一张照片，在这里回看。
    </view>
  </view>
</template>
