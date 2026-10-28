<script lang="ts" setup>
import { back } from '@/utils/journal-ui'

definePage({ style: { navigationStyle: 'custom', navigationBarTitleText: '帮助与关于' } })
</script>

<template>
  <view class="journal-page editor-page about-page">
    <view class="editor-bar">
      <button role="button" class="icon-button" aria-label="返回" @click="back">
        <fg-journal-icon name="chevL" />
      </button><text class="serif text-5">帮助与关于</text><view class="w-11" />
    </view>
    <view class="journal-content">
      <fg-journal-help /><view class="account-closing">
        <view />让记忆，如期而至<view />
      </view>
    </view>
  </view>
</template>
