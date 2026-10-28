<script setup lang="ts">
import type { Person } from '@/domain/journal'
import { ref, watch } from 'vue'
import { today } from '@/domain/journal'
import { birthdayOf, blankPerson } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import { chooseLocalPhotos } from '@/utils/journal-media'
import { chooseAction, confirmAction, toast } from '@/utils/journal-ui'

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
async function avatarActions() {
  if (await chooseAction(['移除头像']) === 0)
    person.value.avatar = ''
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
  <view class="person-editor compact-person-editor">
    <view class="flex items-center justify-between">
      <text class="serif text-6">
        {{ personId ? "人物资料" : "新建人物" }}
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
    <view class="person-avatar-editor">
      <view class="person-avatar-control">
        <button role="button" class="avatar-upload-button" aria-label="上传人物头像" :disabled="busy" @click="uploadAvatar">
          <fg-person-avatar :name="person.name" :src="person.avatar" :size="64" /><text class="muted mt-2 text-3">{{ person.avatar ? '更换头像' : '上传头像' }}</text>
        </button>
        <button v-if="person.avatar" role="button" class="avatar-more" aria-label="头像操作" :disabled="busy" @click="avatarActions">
          ⋯
        </button>
      </view>
    </view>
    <label class="field-label mt-5" for="person-name">称呼</label><input
      id="person-name"
      v-model="person.name"
      class="plain-input"
      placeholder="比如，小满、妈妈、阿宁"
      :maxlength="30"
    >
    <view class="paper person-birthday-row">
      <picker mode="date" :value="yearUnknown ? today() : date" start="1900-01-01" :end="today()" @change="date = $event.detail.value; yearUnknown = false; hasBirthday = true">
        <button role="button" class="compact-option-row" aria-label="生日（可选）">
          <text>生日（可选）</text><text>{{ hasBirthday ? yearUnknown ? `${date.slice(5).replace('-', '月')}日 · 补全年份` : date : '未设置' }}</text><text>›</text>
        </button>
      </picker>
      <button v-if="hasBirthday" role="button" class="text-button" :disabled="busy" @click="hasBirthday = false">
        清除
      </button>
    </view>
    <view v-if="hasBirthday && yearUnknown" class="form-hint">
      旧生日仅记录月日，选择完整日期可补全年份。
    </view>
    <label class="field-label mt-5" for="person-remark">备注（可选）</label><textarea
      id="person-remark"
      v-model="person.remark"
      class="lined-input person-remark-input"
      :auto-height="true"
      placeholder="关于这个人，一点小小的记挂…"
      :maxlength="1000"
    />
    <button
      role="button"
      class="primary-button mt-6"
      :disabled="busy"
      @click="save"
    >
      {{ busy ? "正在保存…" : "保存" }}
    </button>
  </view>
</template>
