<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { computed } from 'vue'
import { countdown, nextOccurrence } from '@/domain/journal'
import { agendaSubtitle } from '@/domain/home-presentation'
import { useJournalStore } from '@/store/journal'
import { navigate } from '@/utils/journal-ui'

const props = defineProps<{ items: Anniversary[], date: string }>()
const store = useJournalStore()
const rows = computed(() => props.items.map(event => ({
  event,
  date: nextOccurrence(event, props.date),
  days: countdown(event, props.date),
  subtitle: agendaSubtitle(event, props.date),
  person: store.data.people.find(person => event.personIds?.includes(person.id)),
})))
</script>

<template>
  <view v-if="rows.length" class="paper home-agenda">
    <button v-for="row in rows" :key="row.event.id" role="button" class="home-agenda-row" :class="{ 'home-agenda-has-person': !!row.person }" :aria-label="`查看${row.event.title}`" @click="navigate({ url: `/pages/journal/event-detail?id=${encodeURIComponent(row.event.id)}` })">
      <view class="home-agenda-tile">
        <text>{{ Number(row.date.slice(5, 7)) }}月</text><text>{{ row.date.slice(8) }}</text>
      </view>
      <fg-person-avatar v-if="row.person" :src="row.person.avatar" :name="row.person.name" :size="28" />
      <view class="home-agenda-copy">
        <view class="home-agenda-title">
          {{ row.event.title }}
        </view><view class="home-agenda-subtitle">
          {{ row.subtitle }}
        </view>
      </view>
      <view class="home-agenda-count">
        <text>{{ Math.abs(row.days) }}</text><text>{{ row.days === 0 ? '就是今天' : row.days > 0 ? '天后' : '天前' }}</text>
      </view>
    </button>
  </view>
</template>
