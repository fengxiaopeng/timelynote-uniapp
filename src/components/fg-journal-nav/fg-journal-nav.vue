<script setup lang="ts">
import { ref } from 'vue'
import { customTabbarList } from '@/tabbar/config'

const props = defineProps<{
  path: string
}>()
const open = ref(false)
const icons = ['clock', 'cal', 'book', 'gear']
function go(path: string) {
  if (props.path !== path)
    uni.switchTab({ url: `/${path}` })
}
function create(kind: string) {
  open.value = false
  uni.navigateTo({ url: `/pages/journal/${kind}` })
}
</script>

<template>
  <view class="journal-nav-wrap">
    <view v-if="open" class="create-scrim" @click="open = false" />
    <view
      v-if="open"
      class="create-menu paper"
      role="dialog"
      aria-label="记下一件值得记住的事"
    >
      <view class="serif mb-3 text-5">
        把这一刻留下
      </view>
      <button role="button" class="menu-action" @click="create('compose')">
        <fg-journal-icon name="pen" /><view>
          写一篇手记<text class="muted block text-3">
            一句话，也值得记得
          </text>
        </view><text>→</text>
      </button>
      <button role="button" class="menu-action" @click="create('event-edit')">
        <fg-journal-icon name="cal" /><view>
          添加纪念日<text class="muted block text-3">
            给未来留一份期待
          </text>
        </view><text>→</text>
      </button>
    </view>
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
        <fg-journal-icon :name="icons[index]" /><text>{{ item.text }}</text>
      </button>
      <button
        role="button"
        class="journal-fab"
        :aria-label="open ? '关闭记录入口' : '记一笔'"
        :aria-expanded="open"
        @click="open = !open"
      >
        <text>{{ open ? "×" : "+" }}</text>
      </button>
    </view>
  </view>
</template>
