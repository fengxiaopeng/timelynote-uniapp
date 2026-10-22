<script lang="ts" setup>
import { appInfo } from '@/config/app'

definePage({
  style: {
    navigationBarTitleText: '关于如期手记',
  },
})
</script>

<template>
  <view class="px-6 py-12 text-center">
    <image :src="appInfo.logo" mode="aspectFit" class="mx-auto block h-24 w-24 rounded-5" />
    <view class="mt-5 text-6 font-semibold">
      {{ appInfo.name }}
    </view>
    <view class="mt-3 text-4 text-[#8C7B6B]">
      {{ appInfo.description }}
    </view>
    <view class="mt-8 text-3.5 text-[#8C7B6B]">
      版本 {{ appInfo.version }}
    </view>
  </view>
</template>
