<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJournalStore } from '@/store/journal'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
const store = useJournalStore()
const open = ref(false)
const search = ref('')
const selectedName = computed(
  () =>
    store.data.people.find(person => person.id === props.modelValue)?.name
    || '全部人物',
)
const people = computed(() =>
  store.data.people.filter(person =>
    `${person.name} ${person.relationship}`.includes(search.value.trim()),
  ),
)
function select(id: string) {
  emit('update:modelValue', id)
  open.value = false
}
function show() {
  search.value = ''
  open.value = true
}
</script>

<template>
  <button
    role="button"
    class="chip mb-4"
    :aria-label="`按人物筛选：${selectedName}`"
    @click="show"
  >
    与谁有关 · {{ selectedName }} ▾
  </button>
  <view
    v-if="open"
    class="modal-overlay person-picker-overlay"
    @click.self="open = false"
  >
    <view class="paper modal-panel">
      <view class="flex items-center justify-between">
        <text class="serif text-6">按人物回看</text><button
          role="button"
          class="icon-button"
          aria-label="关闭人物筛选"
          @click="open = false"
        >
          ×
        </button>
      </view><view class="search-box mt-4">
        <input
          v-model="search"
          placeholder="搜索称呼或关系"
          aria-label="搜索筛选人物"
        >
      </view><button
        role="button"
        class="person-option"
        :aria-pressed="!modelValue"
        @click="select('')"
      >
        <text class="flex-1">全部人物</text><text v-if="!modelValue">✓</text>
      </button><button
        v-for="person in people"
        :key="person.id"
        role="button"
        class="person-option"
        :aria-pressed="modelValue === person.id"
        @click="select(person.id)"
      >
        <text class="person-avatar">{{ person.name.slice(0, 1) }}</text><view class="flex-1">
          <view>{{ person.name }}</view><view class="muted text-3">
            {{ person.relationship
            }}{{ person.archived ? " · 已归档" : "" }}
          </view>
        </view><text v-if="modelValue === person.id">✓</text>
      </button><view v-if="!people.length" class="small-empty">
        没有找到，换个称呼试试。
      </view>
    </view>
  </view>
</template>
