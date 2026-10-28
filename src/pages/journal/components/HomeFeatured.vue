<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { computed } from 'vue'
import { featuredDay } from '@/domain/home-presentation'
import { useJournalStore } from '@/store/journal'
import { navigate } from '@/utils/journal-ui'

const props = defineProps<{ event: Anniversary, date: string }>()
const store = useJournalStore()
const metric = computed(() => featuredDay(props.event, props.date))
const person = computed(() => store.data.people.find(person => props.event.personIds?.includes(person.id)))
</script>

<template>
  <button role="button" class="home-featured" :aria-label="`查看${event.title}`" @click="navigate({ url: `/pages/journal/event-detail?id=${encodeURIComponent(event.id)}` })">
    <view class="home-featured-copy">
      <view class="home-featured-eyebrow">
        <fg-journal-icon name="heart" /><text>{{ event.category === '纪念' ? '我们的纪念' : '重要的日子' }}</text>
      </view>
      <view class="home-featured-title">
        {{ event.title }}
      </view>
      <view class="home-featured-metric">
        <text v-if="metric.isToday" class="home-featured-today">就是今天</text>
        <template v-else>
          <text class="home-featured-prefix">{{ metric.prefix }}</text><text class="home-featured-number">{{ metric.days.toLocaleString() }}</text><text class="home-featured-unit">天</text>
        </template>
      </view>
      <view class="home-featured-period">
        {{ metric.period }}
      </view>
    </view>
    <view class="home-featured-side">
      <view class="home-featured-hearts" aria-hidden="true">
        <fg-journal-icon name="hearts" />
      </view>
      <view v-if="person" class="home-featured-person">
        <fg-person-avatar :src="person.avatar" :name="person.name" :size="38" /><text>{{ person.name }}</text>
      </view>
    </view>
    <view v-if="event.pinned" class="home-featured-pin" aria-label="置顶">
      <fg-journal-icon name="star" />
    </view>
  </button>
</template>
