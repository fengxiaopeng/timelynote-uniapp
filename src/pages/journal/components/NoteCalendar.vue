<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { today } from '@/domain/journal'
import {
  dayInMonth,
  monthCells,
  notesByDate,
  shiftMonth,
  shortDate,
} from '@/domain/note-views'
import { navigate } from '@/utils/journal-ui'

const props = defineProps<{ notes: Note[], month: string, selected: string }>()
const emit = defineEmits<{
  'update:month': [month: string]
  'update:selected': [date: string]
}>()
const cells = computed(() => monthCells(props.month))
const groups = computed(() => notesByDate(props.notes))
const selectedNotes = computed(() => groups.value.get(props.selected) || [])
const paging = ref<{
  clear: () => void
  pageReachBottom: () => void
  setLocalPaging: (notes: Note[]) => Promise<unknown>
} | null>(null)
const visibleNotes = ref<Note[]>([])
watch(
  [selectedNotes, paging],
  () => {
    if (paging.value) {
      paging.value.clear()
      void paging.value.setLocalPaging(selectedNotes.value)
    }
  },
  { immediate: true },
)
onReachBottom(() => paging.value?.pageReachBottom())
const label = computed(
  () => `${Number(props.month.slice(0, 4))}年${Number(props.month.slice(5))}月`,
)
function changeMonth(month: string) {
  emit('update:month', month)
  emit('update:selected', dayInMonth(props.selected, month))
}
function open(note: Note) {
  navigate({
    url: `/pages/journal/note-detail?id=${encodeURIComponent(note.id)}`,
  })
}
</script>

<template>
  <view class="note-calendar">
    <view class="note-calendar-header">
      <button
        role="button"
        class="icon-button"
        aria-label="上个月"
        :disabled="month <= '1900-01'"
        @click="changeMonth(shiftMonth(month, -1))"
      >
        ‹
      </button><picker
        mode="date"
        fields="month"
        :value="`${month}-01`"
        start="1900-01-01"
        end="2100-12-31"
        @change="changeMonth($event.detail.value.slice(0, 7))"
      >
        <button
          role="button"
          class="note-month-label"
          aria-label="选择日历月份"
        >
          {{ label }}
        </button>
      </picker><button
        role="button"
        class="icon-button"
        aria-label="下个月"
        :disabled="month >= '2100-12'"
        @click="changeMonth(shiftMonth(month, 1))"
      >
        ›
      </button>
    </view>
    <view class="note-calendar-grid">
      <text
        v-for="weekday in ['一', '二', '三', '四', '五', '六', '日']"
        :key="weekday"
        class="note-weekday"
      >
        {{ weekday }}
      </text><view
        v-for="(date, position) in cells"
        :key="date || `blank-${position}`"
        class="note-calendar-cell"
      >
        <button
          v-if="date"
          role="button"
          class="note-calendar-day"
          :class="{ 'chosen': selected === date, 'is-today': date === today() }"
          :aria-label="`${date}${groups.has(date) ? `，${groups.get(date)?.length}篇手记` : '，无手记'}`"
          :aria-pressed="selected === date"
          @click="emit('update:selected', date)"
        >
          <text class="note-day-number">{{ Number(date.slice(8)) }}</text><text
            v-if="groups.has(date)"
            class="note-day-dot"
            aria-hidden="true"
          />
        </button>
      </view>
    </view>
    <view class="note-calendar-records">
      <view class="calendar-day-label">
        {{ shortDate(selected)
        }}<text>· {{ selectedNotes.length }}篇手记</text>
      </view><z-paging
        ref="paging"
        v-model="visibleNotes"
        :fixed="false"
        :auto="false"
        :use-page-scroll="true"
        :default-page-size="20"
        :refresher-enabled="false"
        :hide-empty-view="true"
        :show-loading-more-no-more-view="false"
      >
        <button
          v-for="note in visibleNotes"
          :key="note.id"
          role="button"
          class="paper calendar-note-card"
          @click="open(note)"
        >
          <image
            v-if="note.images.length"
            :src="note.images[0]"
            class="calendar-note-thumb"
            mode="aspectFill"
          /><view
            v-else-if="note.sample && note.id === 'sample-sea'"
            class="calendar-note-thumb photo--sea"
          /><view v-else class="calendar-note-thumb calendar-text-thumb">
            <fg-journal-icon name="pen" />
          </view><view class="min-w-0 flex-1">
            <view class="calendar-note-title">
              {{ note.title || "一页日常" }}
            </view><view class="calendar-note-excerpt">
              {{ note.content || "把这一刻，留在照片里。" }}
            </view>
          </view>
        </button>
      </z-paging><view v-if="!selectedNotes.length" class="small-empty serif">
        这一天，还没有留下手记。
      </view>
    </view>
  </view>
</template>
