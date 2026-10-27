<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [date: string] }>()
const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
const month = computed(() => Number(props.modelValue.slice(5, 7)))
const day = computed(() => Number(props.modelValue.slice(8)))
const days = computed(() =>
  Array.from(
    { length: new Date(2000, month.value, 0).getDate() },
    (_, i) => `${i + 1}日`,
  ),
)
function selectMonth(index: number) {
  const selected = index + 1
  const clamped = Math.min(day.value, new Date(2000, selected, 0).getDate())
  emit(
    'update:modelValue',
    `2000-${String(selected).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`,
  )
}
</script>

<template>
  <view class="flex">
    <picker
      class="flex-1"
      :range="months"
      :value="month - 1"
      @change="selectMonth(Number($event.detail.value))"
    >
      <view class="settings-row">
        生日月份<text class="ml-auto">{{ month }}月 ›</text>
      </view>
    </picker>
    <picker
      class="flex-1"
      :range="days"
      :value="day - 1"
      @change="
        emit(
          'update:modelValue',
          `2000-${String(month).padStart(2, '0')}-${String(Number($event.detail.value) + 1).padStart(2, '0')}`,
        )
      "
    >
      <view class="settings-row">
        日期<text class="ml-auto">{{ day }}日 ›</text>
      </view>
    </picker>
  </view>
</template>
