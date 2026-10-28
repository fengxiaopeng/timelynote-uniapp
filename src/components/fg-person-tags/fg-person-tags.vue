<script setup lang="ts">
import { computed } from 'vue'
import { useJournalStore } from '@/store/journal'
import { navigate } from '@/utils/journal-ui'

const props = defineProps<{ ids?: string[] }>()
const store = useJournalStore()
const people = computed(() =>
  store.data.people.filter(person => props.ids?.includes(person.id)),
)
function open(id: string) {
  navigate({ url: `/pages/people/detail?id=${encodeURIComponent(id)}` })
}
</script>

<template>
  <view v-if="people.length" class="person-tags">
    <view
      v-for="person in people"
      :key="person.id"
      class="person-choice"
      role="button"
      tabindex="0"
      :aria-label="`查看${person.name}`"
      @click.stop="open(person.id)"
      @keydown.enter.stop="open(person.id)"
    >
      <fg-person-avatar :name="person.name" :src="person.avatar" :size="36" /><text class="person-choice-name">{{ person.name }}</text>
    </view>
  </view>
</template>
