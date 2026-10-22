<script lang="ts" setup>
import { appInfo } from '@/config/app'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '如期手记',
  },
})
</script>

<template>
  <view class="px-6 py-10">
    <image :src="appInfo.logo" mode="aspectFit" class="mx-auto block h-32 w-32 rounded-6" />
    <view class="mt-6 text-center text-7 font-semibold">
      {{ appInfo.name }}
    </view>
    <view class="mt-3 text-center text-4 text-[#8C7B6B]">
      {{ appInfo.description }}
    </view>
    <view class="mt-12 rounded-5 bg-white px-6 py-8 text-center">
      <view class="text-5 font-medium">
        留一页，给值得记住的日常
      </view>
      <view class="mt-3 text-3.5 text-[#8C7B6B] leading-7">
        你的故事，将从这里开始。
      </view>
    </view>
  </view>
</template>
