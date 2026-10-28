<script setup lang="ts">
import type { Note } from '@/domain/journal'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { blankNote, today, validDate } from '@/domain/journal'
import { useJournalStore } from '@/store/journal'
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
  if (!options?.id && options?.draft !== '1' && typeof options?.eventId === 'string') {
    const source = store.data.anniversaries.find(event => event.id === options.eventId)
    if (!source) {
      toast('这个纪念日已不存在')
      back()
      return
    }
    note.value.title = source.title
    note.value.personIds = [...(source.personIds || [])]
    note.value.anniversaryId = source.id
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
      </button><text class="serif text-5">{{ editing ? "修改手记" : "随手记" }}</text><picker
        mode="date"
        :value="note.date"
        start="1900-01-01"
        :end="today()"
        @change="note.date = $event.detail.value"
      >
        <button
          role="button"
          class="text-button note-date-button"
          aria-label="修改手记日期"
          :disabled="busy"
        >
          {{ note.date.slice(5).replace("-", " / ") }}
        </button>
      </picker>
    </view>
    <view v-if="ready" class="journal-content form-content">
      <view class="serif mb-6 mt-3 text-7">
        今天，有什么想留下？
      </view>
      <view v-if="note.anniversaryId" class="source-event-label muted mb-5 text-3">
        来自纪念日 · {{ store.data.anniversaries.find(event => event.id === note.anniversaryId)?.title || "已删除的纪念日" }}
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
      <fg-photo-picker
        v-model="note.images"
        label="选一张照片"
        :camera="true"
      />
      <fg-person-picker v-model="note.personIds" />
      <fg-tag-picker v-model="note.tags" />
      <label class="field-label mt-6" for="note-place">地点（可选）</label><input
        id="note-place"
        v-model="note.place"
        class="plain-input"
        placeholder="在哪里留下了这段回忆"
        :maxlength="60"
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
