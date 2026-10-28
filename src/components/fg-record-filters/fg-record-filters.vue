<script setup lang="ts">
import { useJournalStore } from '@/store/journal'
import { toggleFacet } from '@/domain/record-filters'

defineProps<{ tags: string[], people: string[] }>()
const emit = defineEmits<{
  'update:tags': [tags: string[]]
  'update:people': [ids: string[]]
}>()
const store = useJournalStore()
</script>

<template>
  <view class="record-filters mb-5">
    <view class="field-label">
      标签
    </view><view class="chips filter-tags">
      <button
        role="button"
        class="chip"
        :class="{ selected: !tags.length }"
        :aria-pressed="!tags.length"
        @click="emit('update:tags', [])"
      >
        全部标签
      </button><button
        v-for="tag in store.data.tagLibrary"
        :key="tag"
        role="button"
        class="chip"
        :class="{ selected: tags.includes(tag) }"
        :aria-pressed="tags.includes(tag)"
        @click="emit('update:tags', toggleFacet(tags, tag))"
      >
        {{ tag }}
      </button>
    </view>
    <view class="field-label mt-4">
      重要的人
    </view><view class="chips filter-people">
      <button
        role="button"
        class="chip"
        :class="{ selected: !people.length }"
        :aria-pressed="!people.length"
        @click="emit('update:people', [])"
      >
        全部人物
      </button><button
        v-for="person in store.data.people"
        :key="person.id"
        role="button"
        class="chip"
        :class="{ selected: people.includes(person.id) }"
        :aria-pressed="people.includes(person.id)"
        @click="emit('update:people', toggleFacet(people, person.id))"
      >
        {{ person.name }}{{ person.archived ? " · 已归档" : "" }}
      </button>
    </view>
  </view>
</template>
