<script setup lang="ts">
import { navigate } from '@/utils/journal-ui'
import type { Anniversary } from '@/domain/journal'
import { countdown, dateLabel, nextOccurrence } from '@/domain/journal'

defineProps<{
  event: Anniversary
}>()
</script>

<template>
  <button
    role="button"
    class="paper anniversary-card"
    :class="{ urgent: countdown(event) >= 0 && countdown(event) <= 7 }"
    @click="
      navigate({
        url: `/pages/journal/event-detail?id=${encodeURIComponent(event.id)}`,
      })
    "
  >
    <view class="min-w-0 flex-1">
      <view class="card-title">
        {{ event.title }}
        <text
          v-if="countdown(event) >= 0 && countdown(event) <= 7"
          class="stamp"
        >
          临近
        </text>
      </view>
      <view class="muted mt-1 text-3">
        {{ dateLabel(nextOccurrence(event)) }}
      </view>
      <view class="mt-2 flex gap-2">
        <text class="category">{{ event.category }}</text><text v-if="event.sample" class="sample-label">示例</text><text v-if="event.pinned" class="sample-label">置顶</text>
      </view>
      <view v-if="event.tags?.length" class="mt-2 flex flex-wrap gap-2">
        <text v-for="tag in event.tags.slice(0, 3)" :key="tag" class="note-tag">{{ tag }}</text>
      </view>
      <fg-person-tags :ids="event.personIds" />
    </view>
    <view class="countdown">
      <text class="count-number">{{ Math.abs(countdown(event)) }}</text><text class="count-unit">
        {{
          countdown(event) === 0
            ? "就是今天"
            : countdown(event) > 0
              ? "天后"
              : "天前"
        }}
      </text>
    </view>
  </button>
</template>
