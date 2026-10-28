<script setup lang="ts">
import { customTabbarList } from '@/tabbar/config'

const props = defineProps<{ path: string }>()
const icons = ['clock', 'alarm', 'cal', 'gear']
function go(path: string) {
  if (props.path !== path)
    uni.switchTab({ url: `/${path}` })
}
function compose() {
  uni.navigateTo({ url: '/pages/journal/compose' })
}
</script>

<template>
  <view class="journal-nav-wrap">
    <view class="journal-nav" role="navigation" aria-label="主导航">
      <button
        v-for="(item, index) in customTabbarList"
        :key="item.pagePath"
        role="button"
        class="journal-nav-item"
        :class="[{ active: path === item.pagePath }, `nav-item-${index}`]"
        :aria-current="path === item.pagePath ? 'page' : undefined"
        @click="go(item.pagePath)"
      >
        <fg-journal-icon :name="icons[index]" /><text>
          {{
            item.text
          }}
        </text>
      </button><button
        role="button"
        class="journal-fab"
        aria-label="新增手记"
        @click="compose"
      >
        <text>+</text>
      </button>
    </view>
  </view>
</template>
