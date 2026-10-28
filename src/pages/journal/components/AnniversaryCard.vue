<script setup lang="ts">
import type { Anniversary } from '@/domain/journal'
import { computed } from 'vue'
import { navigate } from '@/utils/journal-ui'
import { countdown, nextOccurrence } from '@/domain/journal'
import { compactDate } from '@/domain/feed-presentation'

const props = defineProps<{ event: Anniversary }>()
const remaining = computed(() => countdown(props.event))
const upcomingDate = computed(() => nextOccurrence(props.event))
</script>

<template>
  <button role="button" class="paper anniversary-card" :class="{ urgent: remaining >= 0 && remaining <= 7 }" @click="navigate({ url: `/pages/journal/event-detail?id=${encodeURIComponent(event.id)}` })">
    <view class="card-main">
      <view class="card-title-row">
        <view class="card-title">
          {{ event.title }}
        </view>
        <view v-if="event.pinned" class="card-pin" aria-label="置顶">
          <fg-journal-icon name="star" />
        </view>
      </view>
      <view class="card-date">
        {{ compactDate(upcomingDate) }}
      </view>
    </view>
    <view class="countdown">
      <text class="count-number">{{ Math.abs(remaining) }}</text><text class="count-unit">{{ remaining === 0 ? '就是今天' : remaining > 0 ? '天后' : '天前' }}</text>
    </view>
    <view v-if="event.tags?.length || event.sample || event.personIds?.length" class="card-footer">
      <view class="card-tags event-card-tags">
        <text v-for="tag in (event.tags || []).slice(0, 3)" :key="tag" class="note-tag">{{ tag }}</text>
        <text v-if="(event.tags?.length || 0) > 3" class="card-tag-more">+{{ (event.tags?.length || 0) - 3 }}</text>
        <text v-if="event.sample" class="sample-label">示例</text>
      </view>
      <fg-person-tags :ids="event.personIds" compact />
    </view>
  </button>
</template>
