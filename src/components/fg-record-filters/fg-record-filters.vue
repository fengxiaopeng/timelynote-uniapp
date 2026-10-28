<script setup lang="ts">
import { useJournalStore } from '@/store/journal'
import { toggleFacet } from '@/domain/record-filters'

defineProps<{ tags: string[], people: string[], compact?: boolean }>()
const emit = defineEmits<{
  'update:tags': [tags: string[]]
  'update:people': [ids: string[]]
}>()
const store = useJournalStore()
</script>

<template>
  <view class="record-filters mb-5" :class="{ 'record-filters-compact': compact }">
    <view class="field-label">
      标签
    </view><scroll-view :scroll-x="compact" :show-scrollbar="false">
      <view class="chips filter-tags">
        <button
          role="button"
          class="chip"
          :class="{ selected: !tags.length }"
          :aria-pressed="!tags.length"
          @click="emit('update:tags', [])"
        >
          {{ compact ? "全部" : "全部标签" }}
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
    </scroll-view>
    <view class="field-label mt-4">
      重要的人
    </view><scroll-view :scroll-x="compact" :show-scrollbar="false">
      <view class="chips filter-people">
        <button
          role="button"
          class="chip"
          :class="{ selected: !people.length }"
          :aria-pressed="!people.length"
          @click="emit('update:people', [])"
        >
          {{ compact ? "全部" : "全部人物" }}
        </button><button
          v-for="person in store.data.people"
          :key="person.id"
          role="button"
          class="person-choice"
          :class="{ selected: people.includes(person.id) }"
          :aria-pressed="people.includes(person.id)"
          @click="emit('update:people', toggleFacet(people, person.id))"
        >
          <fg-person-avatar :name="person.name" :src="person.avatar" :size="36" /><text class="person-choice-name">{{ person.name }}</text>
        </button>
      </view>
    </scroll-view>
  </view>
</template>
