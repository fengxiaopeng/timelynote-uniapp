<script setup lang="ts">
import type { Person } from '@/domain/journal'
import { ref, watch } from 'vue'
import { today } from '@/domain/journal'
import { birthdayOf, blankPerson } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import { chooseLocalPhotos } from '@/utils/journal-media'
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
function uploadAvatar() {
  chooseLocalPhotos((images) => {
    if (images[0])
      person.value.avatar = images[0]
  }, error => toast(error.message), { source: 'album', multiple: false, maxDimension: 256 })
}
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
    <view class="person-avatar-editor mt-5">
      <button role="button" class="avatar-upload-button" aria-label="上传人物头像" :disabled="busy" @click="uploadAvatar">
        <fg-person-avatar :name="person.name" :src="person.avatar" :size="72" />
        <text class="muted mt-2 text-3">{{ person.avatar ? '更换头像' : '上传头像' }}</text>
      </button>
      <button v-if="person.avatar" role="button" class="text-button text-3" :disabled="busy" @click="person.avatar = ''">
        移除头像
      </button>
    </view>
    <label class="field-label mt-5" for="person-name">怎么称呼</label><input
      id="person-name"
      v-model="person.name"
      class="plain-input"
      placeholder="比如，小满、妈妈、阿宁"
      :maxlength="30"
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
        <picker
          mode="date"
          :value="yearUnknown ? today() : date"
          start="1900-01-01"
          :end="today()"
          @change="date = $event.detail.value; yearUnknown = false"
        >
          <view class="settings-row">
            <text class="flex-1">公历生日</text><text>
              {{ yearUnknown ? `${date.slice(5).replace("-", "月")}日 · 补全年份` : date }}
              ›
            </text>
          </view>
        </picker>
      </template>
    </view><view v-if="hasBirthday && yearUnknown" class="notice mt-3">
      旧生日仅记录了月日；选择完整公历日期后补全年份，不会自动推测出生年份。
    </view><view v-if="hasBirthday" class="notice mt-3">
      保存后生日会出现在纪念日里，每年纪念；两处修改保持一致。2 月 29 日在非闰年按 2 月 28 日纪念。
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
