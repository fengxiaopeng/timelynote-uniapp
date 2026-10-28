<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
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
const reminderOpen = ref(false)
const advancedOpen = ref(false)
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
  reminderOpen.value = options?.section === 'reminder'
  if (
    typeof options?.personId === 'string'
    && store.data.people.some(person => person.id === options.personId)
  ) {
    event.value.personIds = [options.personId]
  }
  initial.value = JSON.stringify(event.value)
  ready.value = true
})
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
  <view class="journal-page editor-page compact-event-editor">
    <view class="editor-bar">
      <button role="button" class="text-button" :disabled="busy" @click="cancel">
        取消
      </button><text class="serif text-5">{{ editing ? '修改纪念日' : '新建纪念日' }}</text><view class="w-11" />
    </view>
    <view v-if="ready" class="journal-content form-content">
      <label class="field-label" for="event-title">纪念日名称</label><input id="event-title" v-model="event.title" class="title-input" placeholder="比如，结婚纪念日" :maxlength="40">
      <picker mode="date" :value="event.yearUnknown ? today() : event.date" start="1900-01-01" :end="event.birthdayPersonId ? today() : '2100-12-31'" @change="event.date = $event.detail.value; event.yearUnknown = false">
        <button role="button" class="paper compact-option-row event-date-row" aria-label="公历日期">
          <text>公历日期</text><text>{{ event.yearUnknown ? `${Number(event.date.slice(5, 7))}月${Number(event.date.slice(8))}日 · 补全年份` : dateLabel(event.date) }}</text><text>›</text>
        </button>
      </picker>
      <view v-if="event.birthdayPersonId" class="form-hint">
        人物生日，日期与人物资料同步。
      </view>
      <fg-person-picker v-model="event.personIds" :locked-ids="event.birthdayPersonId ? [event.birthdayPersonId] : []" />
      <fg-tag-picker v-model="event.tags" label="纪念日标签" scope="event" :locked-tags="event.birthdayPersonId ? ['生日'] : []" />
      <view class="paper compact-options">
        <picker :range="['每年', '只此一次']" :value="event.repeat === 'yearly' ? 0 : 1" :disabled="!!event.birthdayPersonId" @change="event.repeat = Number($event.detail.value) === 0 ? 'yearly' : 'once'">
          <button role="button" class="compact-option-row" aria-label="重复方式" :disabled="!!event.birthdayPersonId">
            <fg-journal-icon name="sync" /><text>重复</text><text>{{ event.repeat === 'yearly' ? '每年' : '只此一次' }}</text><text>›</text>
          </button>
        </picker>
        <button role="button" class="compact-option-row" aria-label="提醒设置" :aria-expanded="reminderOpen" @click="reminderOpen = !reminderOpen">
          <fg-journal-icon name="bell" /><text>提醒</text><text>{{ event.reminderDays ? `提前${event.reminderDays}天` : '当天' }} · {{ event.reminderTime }}</text><text>{{ reminderOpen ? '⌃' : '›' }}</text>
        </button>
        <view v-if="reminderOpen" class="reminder-fields">
          <view class="field-label">
            提前提醒
          </view><view class="chips">
            <button v-for="days in [0, 1, 3, 7]" :key="days" role="button" class="chip" :class="{ selected: event.reminderDays === days }" :aria-pressed="event.reminderDays === days" @click="event.reminderDays = days">
              {{ days ? `提前 ${days} 天` : '当天' }}
            </button>
          </view>
          <picker mode="time" :value="event.reminderTime" @change="event.reminderTime = $event.detail.value">
            <button role="button" class="compact-option-row" aria-label="提醒时刻">
              <text>提醒时刻</text><text>{{ event.reminderTime }}</text><text>›</text>
            </button>
          </picker>
        </view>
        <button role="button" class="compact-option-row" aria-label="更多纪念日设置" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen">
          <fg-journal-icon name="gear" /><text>更多设置</text><text>{{ event.pinned ? '首页主卡' : '' }}</text><text>{{ advancedOpen ? '⌃' : '›' }}</text>
        </button>
        <view v-if="advancedOpen" class="compact-option-row">
          <text>设为首页主卡</text><switch aria-label="设为首页主卡" :checked="event.pinned" color="#b44232" @change="event.pinned = $event.detail.value" />
        </view>
      </view>
      <view v-if="event.date.endsWith('02-29') && event.repeat === 'yearly'" class="form-hint">
        非闰年按 2 月 28 日纪念，原始日期不变。
      </view>
      <view class="form-hint">
        仅保存提醒偏好，暂不发送系统通知。
      </view>
    </view>
    <view v-if="ready" class="editor-save-area">
      <button role="button" class="primary-button" :disabled="busy" @click="save">
        {{ busy ? '正在保存…' : editing ? '保存' : '保存纪念日' }}
      </button>
    </view>
  </view>
</template>
