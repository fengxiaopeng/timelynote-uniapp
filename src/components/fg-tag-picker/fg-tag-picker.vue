<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJournalStore } from '@/store/journal'
import { toast } from '@/utils/journal-ui'

const props = withDefaults(
  defineProps<{ modelValue?: string[], label?: string }>(),
  { label: '给回忆贴个标签' },
)
const emit = defineEmits<{ 'update:modelValue': [tags: string[]] }>()
const store = useJournalStore()
const adding = ref(false)
const name = ref('')
const busy = ref(false)
const tags = computed(() => [
  ...new Set([...store.data.tagLibrary, ...(props.modelValue || [])]),
])
function toggle(tag: string) {
  const selected = props.modelValue || []
  emit(
    'update:modelValue',
    selected.includes(tag)
      ? selected.filter(item => item !== tag)
      : [...selected, tag],
  )
}
async function create() {
  if (busy.value)
    return
  busy.value = true
  try {
    const tag = await store.saveTag(name.value)
    emit('update:modelValue', [...new Set([...(props.modelValue || []), tag])])
    name.value = ''
    adding.value = false
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
  <view class="tag-picker my-5">
    <view class="field-label">
      {{ label }}
    </view><view class="chips">
      <button
        v-for="tag in tags"
        :key="tag"
        role="button"
        class="chip"
        :class="{ selected: modelValue?.includes(tag) }"
        :aria-pressed="!!modelValue?.includes(tag)"
        @click="toggle(tag)"
      >
        {{ tag }}{{ modelValue?.includes(tag) ? " ✓" : "" }}
      </button><button
        v-if="!adding"
        role="button"
        class="chip chip-add"
        @click="adding = true"
      >
        ＋ 新建标签
      </button>
    </view><view v-if="adding" class="tag-create-row mt-3">
      <input
        v-model="name"
        class="plain-input flex-1"
        placeholder="新标签，最多 20 个字"
        aria-label="新标签名称"
        :maxlength="20"
        :focus="true"
        confirm-type="done"
        :disabled="busy"
        @confirm="create"
      ><button
        role="button"
        class="text-button strong"
        :disabled="busy"
        @click="create"
      >
        {{ busy ? "添加中…" : "添加" }}
      </button><button
        role="button"
        class="icon-button"
        aria-label="取消新建标签"
        :disabled="busy"
        @click="
          adding = false;
          name = '';
        "
      >
        ×
      </button>
    </view>
  </view>
</template>
