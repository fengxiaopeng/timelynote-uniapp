<script setup lang="ts">
import type { NoteView } from '@/domain/note-views'
import { onShow } from '@dcloudio/uni-app'
import { computed, nextTick, ref } from 'vue'
import { today } from '@/domain/journal'
import { matchesRecordFacets } from '@/domain/record-filters'
import { useJournalStore } from '@/store/journal'
import { navigate } from '@/utils/journal-ui'
import NoteList from './NoteList.vue'
import NoteViewMenu from './NoteViewMenu.vue'
import NoteAlbum from './NoteAlbum.vue'
import NoteCalendar from './NoteCalendar.vue'

const store = useJournalStore()
const view = ref<NoteView>('default')
const selectedTags = ref<string[]>([])
const selectedPeople = ref<string[]>([])
const month = ref(today().slice(0, 7))
const selectedDate = ref(today())
const owner = ref(store.owner)
const filtered = computed(() =>
  store.sortedNotes.filter(note =>
    matchesRecordFacets(note, selectedTags.value, selectedPeople.value),
  ),
)
async function selectView(next: NoteView) {
  view.value = next
  await nextTick()
  uni.pageScrollTo({ scrollTop: 0, duration: 0 })
}
onShow(async () => {
  if (owner.value !== store.owner) {
    view.value = 'default'
    selectedTags.value = []
    selectedPeople.value = []
    month.value = today().slice(0, 7)
    selectedDate.value = today()
    owner.value = store.owner
  }
  await store.load()
  selectedPeople.value = selectedPeople.value.filter(id =>
    store.data.people.some(person => person.id === id),
  )
  selectedTags.value = selectedTags.value.filter(tag =>
    store.data.tagLibrary.includes(tag),
  )
})
</script>

<template>
  <view class="journal-page feed-page notes-workspace">
    <view class="journal-appbar notes-appbar">
      <view class="notes-heading-row">
        <view class="page-title">
          一页一日
        </view><NoteViewMenu
          :model-value="view"
          @update:model-value="selectView"
        />
      </view><view class="eyebrow">
        留住那些，细碎而闪亮的瞬间
      </view>
    </view><view class="journal-content">
      <template v-if="view === 'default'">
        <fg-record-filters
          v-model:tags="selectedTags"
          v-model:people="selectedPeople"
        /><view class="section-label">
          记得<text>{{ filtered.length }}篇手记</text>
        </view><NoteList :items="filtered" /><view
          v-if="!filtered.length"
          class="small-empty serif"
        >
          {{
            store.data.notes.length
              ? "没有找到对应的手记，换个条件试试。"
              : "今天有什么值得记得？一句话就能留下。"
          }}
        </view><button
          v-if="!store.data.notes.length"
          role="button"
          class="primary-button mt-5"
          @click="navigate({ url: '/pages/journal/compose' })"
        >
          写第一篇手记
        </button>
      </template><NoteAlbum
        v-else-if="view === 'album'"
        :notes="store.sortedNotes"
      /><NoteCalendar
        v-else
        v-model:month="month"
        v-model:selected="selectedDate"
        :notes="store.sortedNotes"
      />
    </view>
  </view>
</template>
