<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJournalStore } from '@/store/journal'
import PersonEditor from '@/pages/people/components/PersonEditor.vue'

const props = defineProps<{ modelValue?: string[], lockedIds?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()
const store = useJournalStore()
const creating = ref(false)
const people = computed(() => store.data.people)
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
    </view><view class="editor-tag-row">
      <scroll-view scroll-x :show-scrollbar="false" class="editor-tag-scroll">
        <view class="chips editor-tag-chips">
          <button
            v-for="person in people"
            :key="person.id"
            role="button"
            class="person-choice"
            :class="{
              'selected': modelValue?.includes(person.id),
              'person-owner': lockedIds?.includes(person.id),
            }"
            :disabled="lockedIds?.includes(person.id)"
            :aria-label="person.name"
            :aria-pressed="!!modelValue?.includes(person.id)"
            @click="toggle(person.id)"
          >
            <view class="person-choice-image">
              <fg-person-avatar :name="person.name" :src="person.avatar" />
              <text v-if="modelValue?.includes(person.id)" class="person-choice-check">✓</text>
            </view>
            <text class="person-choice-name">{{ person.name }}</text>
          </button>
        </view>
      </scroll-view>
      <button role="button" class="person-choice person-choice-add" aria-label="添加人物" @click="creating = true">
        <view class="person-choice-plus">
          ＋
        </view><text class="person-choice-name">添加</text>
      </button>
    </view>
  </view>
  <view v-if="creating" class="modal-overlay person-picker-overlay">
    <view class="paper modal-panel">
      <PersonEditor @saved="saved" @cancel="creating = false" />
    </view>
  </view>
</template>
