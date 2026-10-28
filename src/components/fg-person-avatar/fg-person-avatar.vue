<script setup lang="ts">
withDefaults(defineProps<{ name?: string, src?: string, size?: number }>(), { name: '', src: '', size: 44 })
</script>

<template>
  <view class="person-avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size / 2)}px` }" aria-hidden="true">
    <image v-if="src" :src="src" mode="aspectFill" class="person-avatar-image" />
    <text v-else>{{ name.trim().slice(0, 1) || '人' }}</text>
  </view>
</template>
