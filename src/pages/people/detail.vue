<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { birthdayLabel, birthdayOf } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import { back, confirmAction, navigate, toast } from '@/utils/journal-ui'
import AnniversaryList from '@/pages/journal/components/AnniversaryList.vue'
import NoteList from '@/pages/journal/components/NoteList.vue'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '重要的人' },
})
const store = useJournalStore()
const id = ref('')
const tab = ref('events')
const busy = ref(false)
const person = computed(() =>
  store.data.people.find(item => item.id === id.value),
)
const birthday = computed(() =>
  person.value ? birthdayOf(store.data, person.value) : undefined,
)
const events = computed(() =>
  store.sortedEvents.filter(event => event.personIds?.includes(id.value)),
)
const notes = computed(() =>
  store.sortedNotes.filter(note => note.personIds?.includes(id.value)),
)
onLoad((options) => {
  id.value = typeof options?.id === 'string' ? options.id : ''
})
onShow(() => {
  void store.load()
})
async function archive() {
  if (!person.value || busy.value)
    return
  busy.value = true
  try {
    await store.update((next) => {
      const item = next.people.find(p => p.id === id.value)
      if (item)
        item.archived = !item.archived
    })
    toast(
      person.value.archived ? '人物已归档，历史关联保留' : '已回到记在心上的人',
    )
  }
  catch (error) {
    toast((error as Error).message)
  }
  finally {
    busy.value = false
  }
}
async function remove() {
  if (
    busy.value
    || !(await confirmAction(
      '删除这位人物？',
      '只删除人物资料和人物关联，生日纪念日与所有手记均保留。删除无法恢复，也可以选择归档保留关联。',
    ))
  ) {
    return
  }
  busy.value = true
  try {
    await store.deletePerson(id.value)
    toast('人物已删除，记录仍保留')
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
  <view class="journal-page editor-page">
    <view class="editor-bar">
      <button
        role="button"
        class="icon-button"
        aria-label="返回"
        @click="back"
      >
        <fg-journal-icon name="chevL" />
      </button><text class="serif text-5">重要的人</text><button
        v-if="person"
        role="button"
        class="text-button strong"
        @click="
          navigate({ url: `/pages/people/edit?id=${encodeURIComponent(id)}` })
        "
      >
        编辑
      </button>
    </view><view v-if="person" class="journal-content form-content">
      <view class="person-detail-header">
        <text class="person-avatar">{{ person.name.slice(0, 1) }}</text><view class="serif mt-4 text-8">
          {{ person.name }}
        </view><view class="muted text-3.5">
          {{ person.relationship
          }}{{ person.archived ? " · 已归档" : "" }}
        </view>
      </view><button
        role="button"
        class="person-select-row paper my-5"
        @click="
          navigate({
            url: birthday
              ? `/pages/journal/event-detail?id=${encodeURIComponent(birthday.id)}`
              : `/pages/people/edit?id=${encodeURIComponent(id)}`,
          })
        "
      >
        <fg-journal-icon name="cal" /><view class="flex-1">
          <view>{{ birthdayLabel(birthday) }}</view><view class="muted mt-1 text-3">
            {{
              birthday
                ? "生日也是值得纪念的一天"
                : "可以补上生日，也可以只记住这个人"
            }}
          </view>
        </view><text>›</text>
      </button><view v-if="person.remark" class="event-message">
        {{
          person.remark
        }}
      </view><view class="chips mb-5">
        <button
          role="button"
          class="chip"
          :class="{ selected: tab === 'events' }"
          @click="tab = 'events'"
        >
          纪念日 · {{ events.length }}
        </button><button
          role="button"
          class="chip"
          :class="{ selected: tab === 'notes' }"
          @click="tab = 'notes'"
        >
          手记 · {{ notes.length }}
        </button>
      </view><template v-if="tab === 'events'">
        <AnniversaryList :items="events" /><view
          v-if="!events.length"
          class="small-empty"
        >
          还没有与这个人有关的纪念日。
        </view>
      </template><template v-else>
        <NoteList :items="notes" /><view
          v-if="!notes.length"
          class="small-empty"
        >
          还没有与这个人有关的手记。
        </view>
      </template><view class="mt-6 flex gap-3">
        <button
          role="button"
          class="outline-button flex-1"
          @click="
            navigate({
              url: `/pages/journal/event-edit?personId=${encodeURIComponent(id)}`,
            })
          "
        >
          记一个日子
        </button><button
          role="button"
          class="primary-button flex-1"
          @click="
            navigate({
              url: `/pages/journal/compose?personId=${encodeURIComponent(id)}`,
            })
          "
        >
          写一篇手记
        </button>
      </view><button
        role="button"
        class="outline-button mt-6"
        :disabled="busy"
        @click="archive"
      >
        {{ person.archived ? "取消归档" : "归档人物，保留回忆" }}
      </button><button
        role="button"
        class="text-button my-4 w-full"
        :disabled="busy"
        @click="remove"
      >
        删除人物资料
      </button>
    </view><view v-else-if="!store.loading" class="small-empty">
      这位人物已不在这里，记录仍在手账中。
    </view>
  </view>
</template>
