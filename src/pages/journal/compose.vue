<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  blankNote,
  nextOccurrence,
  noteTags,
  today,
  validDate,
} from '@/domain/journal'
import { useJournalStore } from '@/store/journal'
import { chooseLocalPhotos } from '@/utils/journal-media'
import { back, confirmAction, toast } from '@/utils/journal-ui'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '随手记' },
})
const store = useJournalStore()
const note = ref<Note>(blankNote())
const editing = ref(false)
const ready = ref(false)
const busy = ref(false)
const initial = ref('')
const eventTitles = computed(() => [
  '不关联纪念日',
  ...store.data.anniversaries.map(item => item.title),
])
const linkedEvent = computed(() =>
  store.data.anniversaries.find(item => item.id === note.value.anniversaryId),
)
onLoad(async (options) => {
  await store.load()
  if (options?.id) {
    const existing = store.data.notes.find(item => item.id === options.id)
    if (!existing) {
      toast('这篇手记已不存在')
      back()
      return
    }
    note.value = JSON.parse(JSON.stringify(existing))
    editing.value = true
  }
  else if (options?.draft === '1' && store.data.draft) {
    note.value = JSON.parse(JSON.stringify(store.data.draft))
  }
  if (options?.eventId) {
    const event = store.data.anniversaries.find(
      item => item.id === options.eventId,
    )
    if (event) {
      note.value.anniversaryId = event.id
      note.value.occurrence = nextOccurrence(event)
      note.value.personIds = [...(event.personIds || [])]
    }
  }
  if (
    typeof options?.personId === 'string'
    && store.data.people.some(person => person.id === options.personId)
  ) {
    note.value.personIds = [
      ...new Set([...(note.value.personIds || []), options.personId]),
    ]
  }
  initial.value = JSON.stringify(note.value)
  ready.value = true
})
function toggleTag(tag: string) {
  const index = note.value.tags.indexOf(tag)
  if (index < 0)
    note.value.tags.push(tag)
  else note.value.tags.splice(index, 1)
}
async function link(index: number) {
  const event = store.data.anniversaries[index - 1]
  note.value.anniversaryId = event?.id || ''
  note.value.occurrence = event ? nextOccurrence(event) : ''
  const incoming
    = event?.personIds?.filter(
      id => !(note.value.personIds || []).includes(id),
    ) || []
  if (
    incoming.length
    && (await confirmAction(
      '一起带入与这个日子有关的人？',
      '保留手记已经选择的人，并加入纪念日中的人物；后续各自修改互不影响。',
    ))
  ) {
    note.value.personIds = [
      ...new Set([...(note.value.personIds || []), ...incoming]),
    ]
  }
}
function photos() {
  chooseLocalPhotos(
    (images) => {
      if (note.value.images.length + images.length > 6) {
        toast('一篇手记最多保留 6 张照片')
        return
      }
      if ([...note.value.images, ...images].join('').length > 2500000) {
        toast('照片较多，请减少照片后重试')
        return
      }
      note.value.images.push(...images)
    },
    error => toast(error.message),
  )
}
async function leave() {
  if (busy.value)
    return
  if (JSON.stringify(note.value) === initial.value) {
    back()
    return
  }
  const result = await uni
    .showActionSheet({ itemList: ['存为草稿', '放弃修改'] })
    .catch(() => null)
  if (!result)
    return
  if (result.tapIndex === 0) {
    if (
      store.data.draft
      && store.data.draft.id !== note.value.id
      && !(await confirmAction(
        '替换已有草稿？',
        '本机仅保留一篇草稿，原草稿会被替换。',
      ))
    ) {
      return
    }
    busy.value = true
    try {
      await store.update((next) => {
        next.draft = JSON.parse(JSON.stringify(note.value))
      })
      toast('草稿已留好')
      back()
    }
    catch (error) {
      toast((error as Error).message)
    }
    finally {
      busy.value = false
    }
  }
  else if (await confirmAction('放弃这次修改？', '未保存的内容将丢失。')) {
    back()
  }
}
async function save() {
  if (busy.value)
    return
  if (!note.value.content.trim() && !note.value.images.length) {
    toast('写下一句话，或留一张照片吧')
    return
  }
  if (!validDate(note.value.date) || note.value.date > today()) {
    toast('发生日期不能晚于今天')
    return
  }
  if (note.value.anniversaryId && !validDate(note.value.occurrence)) {
    toast('请选择关联纪念日的具体日期')
    return
  }
  busy.value = true
  try {
    await store.saveNote({
      ...note.value,
      title: note.value.title.trim(),
      content: note.value.content.trim(),
    })
    toast('这一刻，存下了')
    back()
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
  <view class="journal-page editor-page compose-page">
    <view class="editor-bar">
      <button role="button" class="text-button" :disabled="busy" @click="leave">
        稍后
      </button><text class="serif text-5">{{ editing ? "修改手记" : "随手记" }}</text><text class="muted text-3">
        {{ note.date.slice(5).replace("-", " / ") }}
      </text>
    </view>
    <view v-if="ready" class="journal-content form-content">
      <view class="serif mt-3 text-7">
        今天，有什么想留下？
      </view><view class="muted mb-6 mt-2 text-3.5">
        不必特别，一句话也很好。
      </view>
      <label class="field-label" for="note-title">给这一刻起个名字（可选）</label><input
        id="note-title"
        v-model="note.title"
        class="title-input"
        placeholder="一页平凡而珍贵的日常"
        :maxlength="60"
      >
      <label class="field-label mt-6" for="note-content">想记下的话</label><textarea
        id="note-content"
        v-model="note.content"
        class="lined-input note-writing"
        placeholder="此刻的心情，今天的小事…"
        :maxlength="10000"
        :auto-height="true"
      /><view class="muted mt-2 text-right text-3">
        {{ note.content.length }} / 10000
      </view>
      <view class="photo-picker mt-5">
        <view
          v-for="(src, index) in note.images"
          :key="index"
          class="photo-preview"
        >
          <image :src="src" mode="aspectFill" /><button
            role="button"
            class="photo-remove"
            :aria-label="`移除第 ${index + 1} 张照片`"
            @click="note.images.splice(index, 1)"
          >
            ×
          </button>
        </view><button
          v-if="note.images.length < 6"
          role="button"
          class="add-photo"
          @click="photos"
        >
          <fg-journal-icon name="image" /><text>留一张照片</text>
        </button>
      </view>
      <view class="paper settings-group mt-6">
        <picker
          mode="date"
          :value="note.date"
          start="1900-01-01"
          :end="today()"
          @change="note.date = $event.detail.value"
        >
          <view class="settings-row">
            <fg-journal-icon name="cal" /><text class="flex-1">发生日期</text><text>{{ note.date }} ›</text>
          </view>
        </picker><picker
          :range="eventTitles"
          :value="
            store.data.anniversaries.findIndex(
              (item) => item.id === note.anniversaryId,
            ) + 1
          "
          @change="link(Number($event.detail.value))"
        >
          <view class="settings-row">
            <fg-journal-icon name="link" /><text class="flex-1">关联纪念日</text><text>{{ linkedEvent?.title || "可选" }} ›</text>
          </view>
        </picker><picker
          v-if="linkedEvent"
          mode="date"
          :value="note.occurrence"
          start="1900-01-01"
          end="2100-12-31"
          @change="note.occurrence = $event.detail.value"
        >
          <view class="settings-row">
            <text class="flex-1">关联哪一次</text><text>{{ note.occurrence }} ›</text>
          </view>
        </picker>
      </view>
      <view v-if="linkedEvent" class="notice mt-2">
        关联日期用于整理回忆，不会改变手记的发生日期。
      </view>
      <fg-person-picker v-model="note.personIds" />
      <view class="field-label mt-6">
        给回忆贴个标签
      </view><view class="chips">
        <button
          v-for="tag in noteTags"
          :key="tag"
          role="button"
          class="chip"
          :class="{ selected: note.tags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button><button
          v-for="tag in note.tags.filter((item) => !noteTags.includes(item))"
          :key="tag"
          role="button"
          class="chip selected"
          @click="toggleTag(tag)"
        >
          {{ tag }} ×
        </button>
      </view>
      <label class="field-label mt-6" for="note-place">地点（可选）</label><input
        id="note-place"
        v-model="note.place"
        class="plain-input"
        placeholder="在哪里留下了这段回忆"
        :maxlength="60"
      ><label class="field-label mt-5" for="note-weather">天气（可选）</label><input
        id="note-weather"
        v-model="note.weather"
        class="plain-input"
        placeholder="比如，晴 · 24°C"
        :maxlength="30"
      >
      <button
        role="button"
        class="primary-button my-7"
        :disabled="busy"
        @click="save"
      >
        {{ busy ? "正在存下…" : "存下手记" }}
      </button>
    </view>
  </view>
</template>
