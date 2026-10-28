<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  categories,
  dateLabel,
  newId,
  today,
  validDate,
} from '@/domain/journal'
import { useJournalStore } from '@/store/journal'
import { back, confirmAction, toast } from '@/utils/journal-ui'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '纪念日' },
})
const store = useJournalStore()
const editing = ref(false)
const busy = ref(false)
const ready = ref(false)
const month = ref(today().slice(0, 7))
const initial = ref('')
const event = ref<Anniversary>({
  id: newId(),
  title: '',
  date: today(),
  category: '纪念',
  repeat: 'yearly',
  reminderDays: 7,
  reminderTime: '09:00',
  pinned: false,
  description: '',
  tags: ['纪念'],
  images: [],
})
const cells = computed(() => {
  const [year, m] = month.value.split('-').map(Number)
  const start = (new Date(year, m - 1, 1).getDay() + 6) % 7
  return [
    ...Array.from({ length: start }, () => 0),
    ...Array.from({ length: new Date(year, m, 0).getDate() }, (_, i) => i + 1),
  ]
})
onLoad(async (options) => {
  await store.load()
  if (options?.id) {
    const existing = store.data.anniversaries.find(
      item => item.id === options.id,
    )
    if (!existing) {
      toast('这个纪念日已不存在')
      back()
      return
    }
    event.value = JSON.parse(
      JSON.stringify({
        ...existing,
        tags: existing.tags || [],
        images: existing.images || [],
      }),
    )
    editing.value = true
  }
  else {
    event.value.reminderDays = store.data.preferences.days
    event.value.reminderTime = store.data.preferences.time
  }
  month.value = event.value.date.slice(0, 7)
  if (
    typeof options?.personId === 'string'
    && store.data.people.some(person => person.id === options.personId)
  ) {
    event.value.personIds = [options.personId]
  }
  initial.value = JSON.stringify(event.value)
  ready.value = true
})
function changeMonth(amount: number) {
  const [year, m] = month.value.split('-').map(Number)
  const next = new Date(year, m - 1 + amount, 1)
  month.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}
function selectDate(day: number) {
  if (day)
    event.value.date = `${month.value}-${String(day).padStart(2, '0')}`
}
function occupied(day: number) {
  return store.data.anniversaries.some(
    item =>
      item.id !== event.value.id
      && item.date.slice(5)
      === `${month.value.slice(5)}-${String(day).padStart(2, '0')}`,
  )
}
async function cancel() {
  if (
    JSON.stringify(event.value) !== initial.value
    && !(await confirmAction('放下这次修改？', '尚未存下的修改将丢失。'))
  ) {
    return
  }
  back()
}
async function save() {
  if (busy.value)
    return
  if (!event.value.title.trim()) {
    toast('先为这天起个名字吧')
    return
  }
  if (!validDate(event.value.date)) {
    toast('请选择有效日期')
    return
  }
  busy.value = true
  try {
    const duplicate = store.data.anniversaries.some(
      item =>
        item.id !== event.value.id
        && item.title === event.value.title.trim()
        && item.date === event.value.date,
    )
    if (
      duplicate
      && !(await confirmAction(
        '这一天似乎已经记下了',
        '有同名同日的纪念日，仍然保存吗？',
      ))
    ) {
      return
    }
    event.value.category = event.value.birthdayPersonId || event.value.tags?.includes('生日')
      ? '生日'
      : categories.slice(1).find(tag => event.value.tags?.includes(tag)) || '纪念'
    await store.saveEvent({
      ...event.value,
      date: event.value.yearUnknown
        ? `2000-${event.value.date.slice(5)}`
        : event.value.date,
      title: event.value.title.trim(),
    })
    toast('重要的日子，记下了')
    if (editing.value) {
      back()
    }
    else {
      uni.redirectTo({
        url: `/pages/journal/event-detail?id=${encodeURIComponent(event.value.id)}`,
      })
    }
  }
  catch (error) {
    toast((error as Error).message)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <view class="journal-page editor-page">
    <view class="editor-bar">
      <button
        role="button"
        class="text-button"
        :disabled="busy"
        @click="cancel"
      >
        取消
      </button><text class="serif text-5">
        {{ editing ? "修改纪念日" : "新的纪念日" }}
      </text><button
        role="button"
        class="text-button strong"
        :disabled="busy || !ready"
        @click="save"
      >
        {{ busy ? "保存中…" : "存下" }}
      </button>
    </view>
    <view v-if="ready" class="journal-content form-content">
      <label class="field-label" for="event-title">为这天起个名字</label><input
        id="event-title"
        v-model="event.title"
        class="title-input"
        placeholder="比如，我们的结婚纪念日"
        :maxlength="40"
      >
      <view v-if="event.birthdayPersonId" class="notice mt-4">
        这是人物资料中的生日，日期修改后两处同步。生日主人的关联始终保留。
      </view>
      <fg-person-picker
        v-model="event.personIds"
        :locked-ids="event.birthdayPersonId ? [event.birthdayPersonId] : []"
      />
      <fg-tag-picker v-model="event.tags" label="标签" scope="event" :locked-tags="event.birthdayPersonId ? ['生日'] : []" />
      <view class="field-label mt-7">
        选一个日子 · 公历
      </view>
      <picker
        mode="date"
        :value="event.yearUnknown ? today() : event.date"
        start="1900-01-01"
        end="2100-12-31"
        @change="
          event.date = $event.detail.value;
          event.yearUnknown = false;
          month = event.date.slice(0, 7);
        "
      >
        <view class="date-picker paper">
          {{
            event.yearUnknown
              ? `${Number(event.date.slice(5, 7))}月${Number(event.date.slice(8))}日 · 请补全年份`
              : dateLabel(event.date)
          }}<text>快速选年 / 月 / 日 ›</text>
        </view>
      </picker>
      <view v-if="!event.yearUnknown" class="paper calendar mt-3">
        <view class="flex items-center justify-between">
          <button
            role="button"
            class="icon-button"
            aria-label="上个月"
            @click="changeMonth(-1)"
          >
            ‹
          </button><text class="serif text-5">{{ month.replace("-", " 年 ") }} 月</text><button
            role="button"
            class="icon-button"
            aria-label="下个月"
            @click="changeMonth(1)"
          >
            ›
          </button>
        </view><view class="calendar-grid">
          <text
            v-for="day in ['一', '二', '三', '四', '五', '六', '日']"
            :key="day"
            class="calendar-weekday"
          >
            {{ day }}
          </text><button
            v-for="(day, index) in cells"
            :key="index"
            role="button"
            class="calendar-day"
            :class="{
              chosen: event.date === `${month}-${String(day).padStart(2, '0')}`,
              occupied: day && occupied(day),
            }"
            :disabled="!day"
            :aria-label="day ? `${month}-${day}` : '空日期'"
            :aria-pressed="
              event.date === `${month}-${String(day).padStart(2, '0')}`
            "
            @click="selectDate(day)"
          >
            {{ day || "" }}
          </button>
        </view><view class="muted mt-3 text-center text-3">
          · 小圆点表示这一天已有纪念日
        </view>
      </view>
      <view class="field-label mt-7">
        多久一次
      </view><view class="chips">
        <button
          role="button"
          class="chip"
          :class="{ selected: event.repeat === 'yearly' }"
          @click="event.repeat = 'yearly'"
        >
          每年
        </button><button
          role="button"
          class="chip"
          :class="{ selected: event.repeat === 'once' }"
          :disabled="!!event.birthdayPersonId"
          @click="event.repeat = 'once'"
        >
          只此一次
        </button>
      </view><view
        v-if="event.date.endsWith('02-29') && event.repeat === 'yearly'"
        class="notice mt-3"
      >
        非闰年按 2 月 28 日纪念，原始日期保持不变。
      </view>
      <view class="field-label mt-7">
        提前多久提醒我
      </view><view class="chips">
        <button
          v-for="days in [0, 1, 3, 7]"
          :key="days"
          role="button"
          class="chip"
          :class="{ selected: event.reminderDays === days }"
          @click="event.reminderDays = days"
        >
          {{ days ? `提前 ${days} 天` : "当天" }}
        </button>
      </view>
      <view class="paper settings-group mt-5">
        <picker
          mode="time"
          :value="event.reminderTime"
          @change="event.reminderTime = $event.detail.value"
        >
          <view class="settings-row">
            <fg-journal-icon name="clock" /><text class="flex-1">提醒时刻</text><text>{{ event.reminderTime }} ›</text>
          </view>
        </picker><view class="settings-row">
          <fg-journal-icon name="star" /><text class="flex-1">
            设为首页情感条
          </text><switch
            :checked="event.pinned"
            color="#b44232"
            @change="event.pinned = $event.detail.value"
          />
        </view>
      </view>
      <view class="notice mt-3">
        提醒规则会保存在本机，当前版本暂不发送系统通知。
      </view>
      <button
        role="button"
        class="primary-button my-6"
        :disabled="busy"
        @click="save"
      >
        {{ busy ? "正在存下…" : "存下这个日子" }}
      </button>
    </view>
  </view>
</template>
