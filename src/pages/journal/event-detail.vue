<script setup lang="ts">
import {
  back,
  confirmAction,
  navigate,
  previewImage,
  toast,
} from '@/utils/journal-ui'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  countdown,
  dateLabel,
  daysBetween,
  nextOccurrence,
  today,
} from '@/domain/journal'
import { useJournalStore } from '@/store/journal'
import NoteCard from './components/NoteCard.vue'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '纪念日详情' },
})
const store = useJournalStore()
const id = ref('')
const date = ref(today())
const event = computed(() =>
  store.data.anniversaries.find(item => item.id === id.value),
)
const notes = computed(() =>
  store.sortedNotes.filter(note => note.anniversaryId === id.value),
)
const groups = computed(() =>
  [
    ...new Set(
      notes.value.map(note => (note.occurrence || note.date).slice(0, 4)),
    ),
  ]
    .sort()
    .reverse(),
)
const nextDate = computed(() =>
  event.value ? nextOccurrence(event.value, date.value) : date.value,
)
const count = computed(() =>
  event.value ? countdown(event.value, date.value) : 0,
)
const progress = computed(() =>
  event.value?.repeat === 'yearly'
    ? Math.max(0, Math.min(1, 1 - count.value / 365))
    : Math.max(
        0,
        Math.min(
          1,
          daysBetween(event.value?.date || date.value, date.value) >= 0 ? 1 : 0,
        ),
      ),
)
const anniversaryYear = computed(
  () =>
    Number(nextDate.value.slice(0, 4)) - Number(event.value?.date.slice(0, 4)),
)
onLoad((options) => {
  id.value = typeof options?.id === 'string' ? options.id : ''
})
onShow(async () => {
  date.value = today()
  await store.load()
})
async function remove() {
  if (
    !(await confirmAction(
      '删除这个纪念日？',
      event.value?.birthdayPersonId
        ? '这也会清空人物资料中的生日。手记和人物本身保留，手记解除纪念日关联。'
        : '关联手记会保留，并解除与这个纪念日的关联。删除后无法恢复。',
    ))
  ) {
    return
  }
  try {
    await store.deleteEvent(id.value)
    toast('纪念日已删除，手记仍保留')
    back()
  }
  catch (error) {
    toast((error as Error).message)
  }
}
</script>

<template>
  <view class="journal-page detail-page">
    <view class="editor-bar">
      <button role="button" class="icon-button" aria-label="返回" @click="back">
        <fg-journal-icon name="chevL" />
      </button><text class="muted text-3">
        {{ event?.category || "纪念日"
        }}<template
          v-if="
            event?.repeat === 'yearly'
              && !event.yearUnknown
              && anniversaryYear > 0
          "
        >
          · {{ anniversaryYear }}
          {{ event.category === "生日" ? "岁生日" : "周年" }}
        </template>
      </text><button v-if="event" role="button" class="text-button strong" @click="navigate({ url: `/pages/journal/event-edit?id=${encodeURIComponent(id)}` })">
        编辑
      </button><button
        v-if="event"
        role="button"
        class="icon-button"
        aria-label="删除纪念日"
        @click="remove"
      >
        ×
      </button>
    </view>
    <template v-if="event">
      <view class="event-hero">
        <view
          class="progress-ring"
          :style="{
            background: `conic-gradient(var(--cinnabar-600) ${progress * 360}deg, var(--edge-soft) 0deg)`,
          }"
        >
          <view class="ring-inner">
            <text class="hero-number">{{ Math.abs(count) }}</text><text class="muted text-3">
              {{ count === 0 ? "就是今天" : count > 0 ? "天后" : "天前" }}
            </text>
          </view>
        </view><view class="serif mt-6 text-8">
          {{ event.title }}
        </view><view class="muted mt-2 text-3.5">
          {{ dateLabel(nextDate) }}
        </view><view class="reminder-badge mt-5">
          {{ event.reminderDays ? `提前 ${event.reminderDays} 天` : "当天" }} ·
          {{ event.reminderTime }} · 规则已保存
        </view><view class="muted mt-3 text-3">
          H5 单机版暂不发送系统通知
        </view><text v-if="event.sample" class="sample-label mt-3">示例纪念日</text>
      </view>
      <view class="journal-content">
        <view v-if="event.personIds?.length" class="mb-5">
          <view class="field-label">
            一起记得
          </view><fg-person-tags :ids="event.personIds" />
        </view>
        <view v-if="event.tags?.length" class="mb-5 flex flex-wrap gap-2">
          <text v-for="tag in event.tags" :key="tag" class="note-tag">{{ tag }}</text>
        </view>
        <view
          v-if="event.description || event.images?.length"
          class="paper event-story"
        >
          <view class="field-label">
            关于这一天
          </view>
          <view v-if="event.description" class="detail-body">
            {{
              event.description
            }}
          </view>
          <view v-if="event.images?.length" class="event-photo-grid mt-4">
            <image
              v-for="(src, index) in event.images"
              :key="index"
              :src="src"
              mode="aspectFill"
              @click="previewImage({ urls: event.images || [], current: src })"
            />
          </view>
        </view><view v-if="notes.length" class="section-label mt-6">
          这一天的手记<text>{{ notes.length }}</text>
        </view><view v-for="year in groups" :key="year" class="mb-7">
          <view class="year-label">
            {{ year }}<text>年</text>
          </view><view class="record-list">
            <view
              v-for="note in notes.filter((item) =>
                (item.occurrence || item.date).startsWith(year),
              )"
              :key="note.id"
              class="record-list-item"
            >
              <NoteCard :note="note" />
            </view>
          </view>
        </view><view v-if="!notes.length" class="small-empty serif">
          写一篇手记，记下与这一天有关的回忆。
        </view><view class="muted mt-6 text-center text-3">
          最初的日子 ·
          {{
            event.yearUnknown
              ? `${Number(event.date.slice(5, 7))}月${Number(event.date.slice(8))}日（年份未填写）`
              : event.date
          }}
          ·
          {{ event.repeat === "yearly" ? "每年纪念" : "只此一次" }}
        </view>
      </view>
      <view class="detail-actions">
        <button
          role="button"
          class="primary-button flex-1"
          @click="
            navigate({
              url: `/pages/journal/compose?eventId=${encodeURIComponent(id)}`,
            })
          "
        >
          <fg-journal-icon name="pen" />写一篇手记
        </button>
      </view>
    </template>
    <view v-else-if="!store.loading" class="empty-welcome">
      <view class="serif text-6">
        这一天还没有记下
      </view><button role="button" class="primary-button mt-6" @click="back">
        返回手账
      </button>
    </view>
  </view>
</template>
