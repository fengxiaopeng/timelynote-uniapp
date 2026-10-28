<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { countdown, daysBetween, today } from '@/domain/journal'
import { matchesRecordFacets } from '@/domain/record-filters'
import { peopleText } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import AnniversaryCard from './AnniversaryCard.vue'
import AnniversaryList from './AnniversaryList.vue'
import NoteList from './NoteList.vue'
import { navigate, switchTab } from '@/utils/journal-ui'

const props = defineProps<{ mode: 'home' | 'events' }>()
const store = useJournalStore()
const owner = ref(store.owner)
const keyword = ref('')
const searchOpen = ref(false)
const selectedTags = ref<string[]>([])
const selectedPeople = ref<string[]>([])
const reminderOpen = ref(false)
const date = ref(today())
const monthName = computed(
  () =>
    [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ][Number(date.value.slice(5, 7)) - 1],
)
const pinned = computed(() =>
  store.data.anniversaries.find(item => item.pinned),
)
const matchingEvents = computed(() =>
  store.sortedEvents.filter(
    event =>
      matchesRecordFacets(event, selectedTags.value, selectedPeople.value)
      && `${event.title} ${event.description} ${event.category} ${(event.tags || []).join(' ')} ${peopleText(store.data, event.personIds)}`.includes(
        keyword.value.trim(),
      ),
  ),
)
const events = computed(() =>
  props.mode === 'home' && !keyword.value
    ? matchingEvents.value
        .filter(event => countdown(event, date.value) >= 0)
        .slice(0, 2)
    : matchingEvents.value,
)
const notes = computed(() =>
  store.sortedNotes.filter(
    note =>
      `${note.title} ${note.content} ${note.tags.join(' ')} ${note.place} ${peopleText(store.data, note.personIds)}`.includes(
        keyword.value.trim(),
      )
      && matchesRecordFacets(note, selectedTags.value, selectedPeople.value),
  ),
)
const hasData = computed(
  () => props.mode === 'events' ? store.data.anniversaries.length > 0 : store.data.notes.length + store.data.anniversaries.length > 0,
)
const upcoming = computed(() =>
  store.sortedEvents
    .filter(event => countdown(event, date.value) >= 0)
    .slice(0, 5),
)
onShow(() => {
  if (owner.value !== store.owner) {
    selectedTags.value = []
    selectedPeople.value = []
    keyword.value = ''
    owner.value = store.owner
  }
  date.value = today()
  void store.load().then(() => {
    selectedPeople.value = selectedPeople.value.filter(id => store.data.people.some(person => person.id === id))
    selectedTags.value = selectedTags.value.filter(tag => (props.mode === 'events' ? store.data.eventTagLibrary : store.data.tagLibrary).includes(tag))
  })
})
async function samples() {
  try {
    await store.addSamples()
    uni.showToast({ title: '已载入示例手账', icon: 'none' })
  }
  catch (error) {
    uni.showToast({ title: (error as Error).message, icon: 'none' })
  }
}
</script>

<template>
  <view class="journal-page feed-page" :class="{ 'events-workspace': mode === 'events', 'home-workspace': mode === 'home' }">
    <view class="journal-appbar" :class="{ 'events-appbar': mode === 'events' }">
      <view>
        <view class="page-title">
          {{
            mode === "home" ? monthName : "值得纪念"
          }}
        </view><view class="eyebrow">
          {{
            mode === "home" ? `${date.slice(0, 4)} · ${new Date(`${date}T12:00:00`).toLocaleDateString("zh-CN", { weekday: "long" })}` : "把重要的日子，放在心上"
          }}
        </view>
      </view>
      <view class="flex gap-1">
        <button
          v-if="mode === 'home'"
          role="button"
          class="icon-button"
          aria-label="搜索"
          @click="searchOpen = !searchOpen"
        >
          <fg-journal-icon name="search" />
        </button><button
          v-if="mode === 'home'"
          role="button"
          class="icon-button"
          aria-label="提醒"
          @click="reminderOpen = true"
        >
          <fg-journal-icon name="bell" />
        </button><button
          v-else
          role="button"
          class="icon-button"
          aria-label="添加纪念日"
          @click="
            navigate({
              url: '/pages/journal/event-edit',
            })
          "
        >
          <text class="text-7">+</text>
        </button>
      </view>
    </view>
    <view class="journal-content">
      <fg-record-filters v-if="mode === 'events'" v-model:tags="selectedTags" v-model:people="selectedPeople" compact minimal scope="event" />
      <view v-if="searchOpen" class="search-box">
        <fg-journal-icon name="search" /><input
          v-model="keyword"
          placeholder="搜索日子、手记、标签…"
          aria-label="搜索日子、手记、标签"
          :focus="searchOpen"
        ><button
          v-if="keyword"
          role="button"
          class="text-button"
          @click="keyword = ''"
        >
          清除
        </button>
      </view>
      <view v-if="mode === 'home' && pinned && !keyword" class="warmbar">
        <fg-journal-icon name="heart" /><text class="warm-copy">
          {{ pinned.title }}，{{
            !pinned.yearUnknown && daysBetween(pinned.date, date) >= 0 ? "已经" : "还有"
          }}
        </text><text class="warm-number">
          {{
            Math.abs(pinned.yearUnknown ? countdown(pinned, date) : daysBetween(pinned.date, date)).toLocaleString()
          }}
        </text><text>天</text>
      </view>
      <view v-if="!hasData" class="empty-welcome">
        <view class="empty-mark">
          记
        </view><view class="serif mt-6 text-7">
          日子会走远，<br>记忆会留下。
        </view><view class="muted mt-4 text-3.5 leading-7">
          为重要的那天留一份期待，<br>也为平凡的今天，留一页手记。
        </view>
        <button
          role="button"
          class="primary-button mt-8"
          @click="navigate({ url: '/pages/journal/event-edit' })"
        >
          添加第一个纪念日
        </button><button
          v-if="mode === 'home'"
          role="button"
          class="outline-button mt-3"
          @click="navigate({ url: '/pages/journal/compose' })"
        >
          先写一篇手记
        </button><button role="button" class="text-button mt-6" @click="samples">
          看看示例手账 →
        </button><view class="muted mt-3 text-3">
          示例内容将单独标记，可随时删除
        </view>
      </view>
      <template v-else>
        <view class="section-label">
          {{
            mode === "home"
              ? keyword
                ? "找到的日子"
                : "将至"
              : events.every(event => countdown(event, date) >= 0) ? "即将到来" : "值得记得"
          }}<text>{{ events.length }}{{ mode === 'events' ? '个纪念日' : '' }}</text><button
            v-if="mode === 'home'"
            role="button"
            class="text-button ml-auto"
            @click="switchTab({ url: '/pages/journal/events' })"
          >
            全部纪念日 →
          </button>
        </view>
        <AnniversaryList :items="events" :summary="mode === 'home' && !keyword" />
        <view v-if="!events.length" class="small-empty">
          {{
            keyword || selectedTags.length || selectedPeople.length
              ? "没有找到对应的日子，换个条件试试。"
              : "还没有将至的日子，给未来留一点期待吧。"
          }}
        </view>
        <view v-if="mode === 'home' && !keyword" class="today-line">
          <text />今天 · {{ Number(date.slice(5, 7)) }}月{{
            Number(date.slice(8))
          }}日<text />
        </view>
        <template v-if="mode !== 'events'">
          <view class="section-label">
            {{ keyword ? "找到的手记" : "记得" }}<text>{{ notes.length }}</text><button role="button" class="text-button ml-auto" @click="switchTab({ url: '/pages/journal/notes' })">
              全部手记 →
            </button>
          </view>
          <NoteList :items="notes" :summary="mode === 'home' && !keyword" />
          <view v-if="!notes.length" class="small-empty">
            {{
              keyword || selectedTags.length || selectedPeople.length
                ? "没有找到对应的手记，换个条件试试。"
                : "今天有什么值得记得？一句话就能留下。"
            }}
          </view>
        </template>
      </template>
    </view>
    <view
      v-if="reminderOpen"
      class="modal-overlay"
      @click.self="reminderOpen = false"
    >
      <view class="paper modal-panel">
        <view class="flex items-center justify-between">
          <view class="serif text-6">
            即将到来的日子
          </view><button
            role="button"
            class="icon-button"
            aria-label="关闭提醒"
            @click="reminderOpen = false"
          >
            ×
          </button>
        </view><view class="notice my-4">
          当前仅保存提醒偏好，H5 单机版暂不发送系统通知。
        </view><view v-for="event in upcoming" :key="event.id" class="mb-3">
          <AnniversaryCard :event="event" />
        </view><view v-if="!upcoming.length" class="small-empty">
          还没有即将到来的纪念日。
        </view>
      </view>
    </view>
  </view>
</template>
