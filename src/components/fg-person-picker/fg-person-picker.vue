<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJournalStore } from '@/store/journal'
import PersonEditor from '@/pages/people/components/PersonEditor.vue'

const props = defineProps<{ modelValue?: string[], lockedIds?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()
const store = useJournalStore()
const creating = ref(false)
const search = ref('')
const people = computed(() =>
  store.data.people.filter(
    person =>
      (!person.archived || props.modelValue?.includes(person.id))
      && `${person.name} ${person.relationship}`.includes(search.value.trim()),
  ),
)
function toggle(id: string) {
  if (props.lockedIds?.includes(id))
    return
  const selected = props.modelValue || []
  emit(
    'update:modelValue',
    selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id],
  )
}
function saved(id: string) {
  emit('update:modelValue', [...new Set([...(props.modelValue || []), id])])
  creating.value = false
}
</script>

<template>
  <view class="person-picker my-5">
    <view class="field-label">
      与谁有关
    </view><view v-if="store.data.people.length > 8" class="search-box">
      <input
        v-model="search"
        placeholder="搜索称呼或关系"
        aria-label="搜索人物"
      >
    </view><view class="editor-tag-row">
      <scroll-view scroll-x :show-scrollbar="false" class="editor-tag-scroll">
        <view class="chips editor-tag-chips">
          <button
            v-for="person in people"
            :key="person.id"
            role="button"
            class="chip"
            :class="{
              'selected': modelValue?.includes(person.id),
              'person-owner': lockedIds?.includes(person.id),
            }"
            :disabled="lockedIds?.includes(person.id)"
            :aria-pressed="!!modelValue?.includes(person.id)"
            @click="toggle(person.id)"
          >
            {{ person.name }}{{ modelValue?.includes(person.id) ? " ✓" : ""
            }}{{ person.archived ? " · 已归档" : "" }}
          </button>
        </view>
      </scroll-view>
      <button role="button" class="chip chip-add" aria-label="添加人物" @click="creating = true">
        ＋ 添加
      </button>
    </view><view v-if="search && !people.length" class="muted mt-2 text-3">
      没有找到，换个称呼试试。
    </view>
  </view>
  <view v-if="creating" class="modal-overlay person-picker-overlay">
    <view class="paper modal-panel">
      <PersonEditor @saved="saved" @cancel="creating = false" />
    </view>
  </view>
</template>
