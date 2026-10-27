<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { categories, countdown, daysBetween, today } from '@/domain/journal'
import { peopleText } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import AnniversaryCard from './AnniversaryCard.vue'
import AnniversaryList from './AnniversaryList.vue'
import NoteList from './NoteList.vue'
import { navigate, switchTab } from '@/utils/journal-ui'

const props = defineProps<{ mode: 'home' | 'events' | 'notes' }>()
const store = useJournalStore()
const keyword = ref('')
const searchOpen = ref(false)
const category = ref('全部')
const photoOnly = ref(false)
const selectedPerson = ref('')
const month = ref('')
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
      (category.value === '全部' || category.value === event.category)
      && (!selectedPerson.value || event.personIds?.includes(selectedPerson.value))
      && `${event.title} ${event.description} ${event.category} ${(event.tags || []).join(' ')} ${peopleText(store.data, event.personIds)}`.includes(
        keyword.value.trim(),
      ),
  ),
)
const events = computed(() =>
  props.mode === 'home' && !keyword.value
    ? matchingEvents.value
        .filter(event => countdown(event, date.value) >= 0)
        .slice(0, 3)
    : matchingEvents.value,
)
const notes = computed(() =>
  store.sortedNotes.filter(
    note =>
      `${note.title} ${note.content} ${note.tags.join(' ')} ${note.place} ${peopleText(store.data, note.personIds)}`.includes(
        keyword.value.trim(),
      )
      && (!selectedPerson.value || note.personIds?.includes(selectedPerson.value))
      && (!photoOnly.value || note.images.length > 0)
      && (!month.value || note.date.startsWith(month.value)),
  ),
)
const months = computed(() => [
  ...new Set(store.sortedNotes.map(note => note.date.slice(0, 7))),
])
const hasData = computed(
  () => store.data.notes.length + store.data.anniversaries.length > 0,
)
const upcoming = computed(() =>
  store.sortedEvents
    .filter(event => countdown(event, date.value) >= 0)
    .slice(0, 5),
)
onShow(() => {
  date.value = today()
  void store.load().then(() => {
    if (!store.data.people.some(person => person.id === selectedPerson.value))
      selectedPerson.value = ''
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
  <view class="journal-page feed-page">
    <view class="journal-appbar">
      <view>
        <view class="page-title">
          {{
            mode === "home"
              ? monthName
              : mode === "events"
                ? "值得纪念"
                : "一页一日"
          }}
        </view><view class="eyebrow">
          {{
            mode === "home"
              ? `${date.slice(0, 4)} · ${new Date(`${date}T12:00:00`).toLocaleDateString("zh-CN", { weekday: "long" })}`
              : mode === "events"
                ? "把重要的日子，放在心上"
                : "留住那些，细碎而闪亮的瞬间"
          }}
        </view>
      </view>
      <view class="flex gap-1">
        <button
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
          :aria-label="mode === 'events' ? '添加纪念日' : '写手记'"
          @click="
            navigate({
              url:
                mode === 'events'
                  ? '/pages/journal/event-edit'
                  : '/pages/journal/compose',
            })
          "
        >
          <text class="text-7">+</text>
        </button>
      </view>
    </view>
    <view class="journal-content">
      <fg-person-filter v-if="mode !== 'home' && store.data.people.length" v-model="selectedPerson" />
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
        <fg-journal-icon name="heart" /><text>
          {{ pinned.title }}，{{
            !pinned.yearUnknown && daysBetween(pinned.date, date) >= 0 ? "已经" : "还有"
          }}
        </text><text class="warm-number">
          {{
            Math.abs(pinned.yearUnknown ? countdown(pinned, date) : daysBetween(pinned.date, date)).toLocaleString()
          }}
        </text><text>天</text>
      </view>
      <view v-if="mode === 'events'" class="chips mb-5">
        <button
          v-for="item in categories"
          :key="item"
          role="button"
          class="chip"
          :class="{ selected: category === item }"
          @click="category = item"
        >
          {{ item }}
        </button>
      </view>
      <view
        v-if="mode === 'notes'"
        class="flex flex-wrap items-center gap-2 pb-5"
      >
        <button
          role="button"
          class="chip"
          :class="{ selected: !photoOnly }"
          @click="photoOnly = false"
        >
          全部手记
        </button><button
          role="button"
          class="chip"
          :class="{ selected: photoOnly }"
          @click="photoOnly = true"
        >
          有照片
        </button><picker
          :range="['全部月份', ...months]"
          @change="
            month
              = Number($event.detail.value) === 0
                ? ''
                : months[Number($event.detail.value) - 1]
          "
        >
          <view class="chip">
            {{ month || "按月份" }} ▾
          </view>
        </picker>
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
        <template v-if="mode !== 'notes'">
          <view class="section-label">
            {{
              mode === "home"
                ? keyword
                  ? "找到的日子"
                  : "将至"
                : "重要的日子"
            }}<text>{{ events.length }}</text><button
              v-if="mode === 'home'"
              role="button"
              class="text-button ml-auto"
              @click="switchTab({ url: '/pages/journal/events' })"
            >
              全部纪念日 →
            </button>
          </view>
          <AnniversaryList :items="events" :summary="mode === 'home'" />
          <view v-if="!events.length" class="small-empty">
            {{
              keyword || category !== "全部"
                ? "没有找到对应的日子，换个条件试试。"
                : "还没有将至的日子，给未来留一点期待吧。"
            }}
          </view>
        </template>
        <view v-if="mode === 'home'" class="today-line">
          <text />◆ 今天 · {{ Number(date.slice(5, 7)) }}月{{
            Number(date.slice(8))
          }}日<text />
        </view>
        <template v-if="mode !== 'events'">
          <view class="section-label">
            {{ keyword ? "找到的手记" : "记得" }}<text>{{ notes.length }}</text><text class="ml-auto text-3 font-normal tracking-normal">
              {{
                mode === "home" ? "那些平凡而珍贵的日常" : "按发生日期排列"
              }}
            </text>
          </view>
          <NoteList :items="notes" :summary="mode === 'home'" />
          <view v-if="!notes.length" class="small-empty">
            {{
              keyword || month || photoOnly
                ? "没有找到对应的手记，换个条件试试。"
                : "今天有什么值得记得？一句话就能留下。"
            }}
          </view>
        </template>
        <view class="feed-footer">
          慢慢过日子，好好记得。<view class="mt-2 text-2.5">
            如期手记 · 把时光放在心上
          </view>
        </view>
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
