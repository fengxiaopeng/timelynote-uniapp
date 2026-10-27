<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJournalStore } from '@/store/journal'
import PersonEditor from '@/pages/people/components/PersonEditor.vue'

const props = defineProps<{ modelValue?: string[], lockedIds?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()
const store = useJournalStore()
const open = ref(false)
const creating = ref(false)
const search = ref('')
const selected = ref<string[]>([])
const selectedNames = computed(() =>
  store.data.people
    .filter(person => (props.modelValue || []).includes(person.id))
    .map(person => person.name)
    .join('、'),
)
const people = computed(() =>
  store.data.people.filter(
    person =>
      (!person.archived || selected.value.includes(person.id))
      && `${person.name} ${person.relationship}`.includes(search.value.trim()),
  ),
)
function show() {
  selected.value = [...(props.modelValue || [])]
  search.value = ''
  open.value = true
}
function toggle(id: string) {
  if (props.lockedIds?.includes(id))
    return
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
}
function saved(id: string) {
  selected.value = [...new Set([...selected.value, id])]
  creating.value = false
}
function done() {
  emit('update:modelValue', selected.value)
  open.value = false
}
</script>

<template>
  <view class="my-5">
    <view class="field-label">
      与谁有关（可选）
    </view><button role="button" class="person-select-row paper" @click="show">
      <fg-journal-icon name="heart" /><text class="flex-1">
        {{
          selectedNames || "选一位或几位重要的人"
        }}
      </text><text>›</text>
    </button>
  </view>
  <view
    v-if="open"
    class="modal-overlay person-picker-overlay"
    @click.self="!creating && (open = false)"
  >
    <view class="paper modal-panel">
      <PersonEditor
        v-if="creating"
        @saved="saved"
        @cancel="creating = false"
      /><template v-else>
        <view class="flex items-center justify-between">
          <text class="serif text-6">与谁有关</text><button
            role="button"
            class="icon-button"
            aria-label="关闭人物选择"
            @click="open = false"
          >
            ×
          </button>
        </view><view class="search-box mt-4">
          <input
            v-model="search"
            placeholder="搜索称呼或关系"
            aria-label="搜索人物"
          >
        </view><button
          v-for="person in people"
          :key="person.id"
          role="button"
          class="person-option"
          :aria-pressed="selected.includes(person.id)"
          @click="toggle(person.id)"
        >
          <text class="person-avatar">{{ person.name.slice(0, 1) }}</text><view class="flex-1">
            <view>{{ person.name }}</view><view class="muted text-3">
              {{ person.relationship
              }}{{ person.archived ? " · 已归档" : "" }}
            </view>
          </view><text>
            {{
              lockedIds?.includes(person.id)
                ? "生日主人"
                : selected.includes(person.id)
                  ? "✓ 已选"
                  : "选择"
            }}
          </text>
        </button><view v-if="!people.length" class="small-empty">
          {{
            search ? "没有找到，换个称呼试试" : "把重要的人，慢慢记在这里。"
          }}
        </view><button
          role="button"
          class="outline-button mt-4"
          @click="creating = true"
        >
          ＋ 添加新人物
        </button><button role="button" class="primary-button mt-3" @click="done">
          完成选择{{ selected.length ? `（${selected.length}）` : "" }}
        </button>
      </template>
    </view>
  </view>
</template>
