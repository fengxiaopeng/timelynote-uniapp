<script setup lang="ts">
import type { Person } from '@/domain/journal'
import { computed, ref, watch } from 'vue'
import { today } from '@/domain/journal'
import { birthdayOf, blankPerson, relationships } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import { confirmAction, toast } from '@/utils/journal-ui'

const props = defineProps<{ personId?: string }>()
const emit = defineEmits<{ saved: [id: string], cancel: [] }>()
const store = useJournalStore()
const person = ref<Person>(blankPerson())
const hasBirthday = ref(false)
const date = ref(today())
const yearUnknown = ref(false)
const reuseId = ref('')
const busy = ref(false)
const initial = ref('')
const originalBirthday = ref(false)
const candidates = computed(() =>
  store.data.anniversaries.filter(
    event =>
      event.category === '生日'
      && (!event.birthdayPersonId || event.birthdayPersonId === person.value.id),
  ),
)
function snapshot() {
  return JSON.stringify([
    person.value,
    hasBirthday.value,
    date.value,
    yearUnknown.value,
    reuseId.value,
  ])
}
watch(
  () => props.personId,
  () => {
    const existing = store.data.people.find(
      item => item.id === props.personId,
    )
    person.value = existing ? { ...existing } : blankPerson()
    const birthday = existing ? birthdayOf(store.data, existing) : undefined
    originalBirthday.value = !!birthday
    hasBirthday.value = !!birthday
    date.value = birthday?.date || today()
    yearUnknown.value = !!birthday?.yearUnknown
    reuseId.value = birthday?.id || ''
    initial.value = snapshot()
  },
  { immediate: true },
)
function setUnknown(unknown: boolean) {
  yearUnknown.value = unknown
  if (unknown)
    date.value = `2000-${date.value.slice(5)}`
}
function reuse(index: number) {
  const event = candidates.value[index - 1]
  reuseId.value = event?.id || ''
  if (event) {
    date.value = event.date
    yearUnknown.value = !!event.yearUnknown
    hasBirthday.value = true
  }
}
async function cancel() {
  if (
    snapshot() !== initial.value
    && !(await confirmAction('放下这次修改？', '尚未保存的人物资料将丢失。'))
  ) {
    return
  }
  emit('cancel')
}
async function save() {
  if (busy.value)
    return
  if (!person.value.name.trim()) {
    toast('请为这位重要的人写下称呼')
    return
  }
  let clear: 'keep' | 'delete' = 'keep'
  if (originalBirthday.value && !hasBirthday.value) {
    const result = await uni
      .showActionSheet({
        itemList: ['清空生日，保留原纪念日', '清空生日，同时删除原纪念日'],
      })
      .catch(() => null)
    if (!result)
      return
    if (result.tapIndex === 1) {
      if (
        !(await confirmAction(
          '同时删除生日纪念日？',
          '生日纪念日会被删除，历史手记保留并解除与该纪念日的关联。',
        ))
      ) {
        return
      }
      clear = 'delete'
    }
  }
  busy.value = true
  try {
    await store.savePerson(
      person.value,
      hasBirthday.value
        ? {
            date: date.value,
            yearUnknown: yearUnknown.value,
            reuseEventId: reuseId.value || undefined,
          }
        : null,
      clear,
    )
    toast('重要的人，记在心上了')
    emit('saved', person.value.id)
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
  <view class="person-editor">
    <view class="flex items-center justify-between">
      <text class="serif text-6">
        {{ personId ? "编辑人物资料" : "记下一位重要的人" }}
      </text><button
        role="button"
        class="icon-button"
        aria-label="取消人物编辑"
        :disabled="busy"
        @click="cancel"
      >
        ×
      </button>
    </view>
    <label class="field-label mt-5" for="person-name">怎么称呼</label><input
      id="person-name"
      v-model="person.name"
      class="plain-input"
      placeholder="比如，小满、妈妈、阿宁"
      :maxlength="30"
    >
    <label class="field-label mt-5" for="person-relationship">你们的关系</label><view class="chips mb-3">
      <button
        v-for="relationship in relationships"
        :key="relationship"
        role="button"
        class="chip"
        :class="{ selected: person.relationship === relationship }"
        @click="person.relationship = relationship"
      >
        {{ relationship }}
      </button>
    </view><input
      id="person-relationship"
      v-model="person.relationship"
      class="plain-input"
      placeholder="也可以填写自己的关系称呼"
      :maxlength="20"
    >
    <view class="paper settings-group mt-5">
      <view class="settings-row">
        <text class="flex-1">记下生日（可选）</text><switch
          color="#b44232"
          :checked="hasBirthday"
          @change="hasBirthday = $event.detail.value"
        />
      </view>
      <template v-if="hasBirthday">
        <view class="settings-row">
          <text class="flex-1">只知道月日</text><switch
            color="#b44232"
            :checked="yearUnknown"
            @change="setUnknown($event.detail.value)"
          />
        </view>
        <fg-month-day-picker v-if="yearUnknown" v-model="date" />
        <picker
          v-else
          mode="date"
          :value="date"
          start="1900-01-01"
          :end="yearUnknown ? '2100-12-31' : today()"
          @change="date = $event.detail.value"
        >
          <view class="settings-row">
            <text class="flex-1">公历生日</text><text>
              {{ yearUnknown ? `${date.slice(5).replace("-", "月")}日` : date }}
              ›
            </text>
          </view>
        </picker><picker
          v-if="candidates.length"
          :range="[
            person.birthdayEventId ? '继续使用当前生日' : '自动创建生日纪念日',
            ...candidates.map((event) => event.title),
          ]"
          :value="candidates.findIndex((event) => event.id === reuseId) + 1"
          @change="reuse(Number($event.detail.value))"
        >
          <view class="settings-row">
            <text class="flex-1">使用已有纪念日</text><text class="person-truncate">
              {{
                candidates.find((event) => event.id === reuseId)?.title
                  || "自动创建"
              }}
              ›
            </text>
          </view>
        </picker>
      </template>
    </view><view v-if="hasBirthday" class="notice mt-3">
      保存后生日会出现在纪念日里，每年纪念；两处修改保持一致。只知道月日时不显示年龄。2
      月 29 日在非闰年按 2 月 28 日纪念。
    </view>
    <label class="field-label mt-5" for="person-remark">想记住的事（可选）</label><textarea
      id="person-remark"
      v-model="person.remark"
      class="lined-input"
      placeholder="关于这个人，一点小小的记挂…"
      :maxlength="1000"
    />
    <button
      role="button"
      class="primary-button mt-6"
      :disabled="busy"
      @click="save"
    >
      {{ busy ? "正在保存…" : "存下人物资料" }}
    </button>
  </view>
</template>
