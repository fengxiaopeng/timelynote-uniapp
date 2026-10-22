<script lang="ts" setup>
import { appInfo } from '@/config/app'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

function openAbout() {
  uni.navigateTo({ url: '/pages/about/about' })
}
</script>

<template>
  <view class="px-6 py-8">
    <view class="flex items-center gap-4 rounded-5 bg-white p-5">
      <image src="/static/images/default-avatar.png" mode="aspectFill" class="h-14 w-14 rounded-full" />
      <view>
        <view class="text-5 font-medium">
          留住每一份珍贵
        </view>
        <view class="mt-2 text-3.5 text-[#8C7B6B]">
          {{ appInfo.description }}
        </view>
      </view>
    </view>
    <button class="mt-6 w-full rounded-4 bg-white text-left text-4" @click="openAbout">
      关于{{ appInfo.name }}
    </button>
  </view>
</template>
