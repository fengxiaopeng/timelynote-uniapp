<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { customTabbarList } from '@/tabbar/config'
import { currRoute } from './utils'

const path = ref('pages/index/index')
onShow(() => {
  uni.hideTabBar({ fail: () => {} })
  const route = currRoute().path.replace(/^\//, '')
  path.value = route || 'pages/index/index'
})
</script>

<template>
  <view>
    <KuRootView />
    <fg-journal-nav v-if="customTabbarList.some(item => item.pagePath === path)" :path="path" />
  </view>
</template>
