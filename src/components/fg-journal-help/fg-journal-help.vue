<script setup lang="ts">
import { appInfo } from '@/config/app'

defineProps<{ compact?: boolean }>()
const sections = [
  { title: '如何开始记录', text: '底部「＋」直接写手记，纪念日在「如期」页新增。纪念日详情可快速创建关联手记。人物和标签点选即可关联，不选筛选项即显示全部。' },
  { title: '备份与恢复', text: '在「我的」导出备份，给回忆留一份副本。恢复前会确认覆盖当前手账。草稿可以继续写，删除时也会再次确认。' },
  { title: '本地数据与隐私', text: '游客和各手机号手账分别保存，退出后再次登录相同号码可查看本机记录。清理浏览器前请先备份，当前不提供云同步。提醒仅保存偏好，暂不发送系统通知。' },
]
</script>

<template>
  <view class="journal-help" :class="{ 'journal-help-compact': compact }">
    <view class="journal-help-brand">
      <image :src="appInfo.logo" mode="aspectFit" /><view>如期手记</view><text>v{{ appInfo.version }}</text><text>记录岁月，珍藏记忆。</text>
    </view>
    <view v-for="section in sections" :key="section.title" class="paper journal-help-section">
      <view>{{ section.title }}</view><text>{{ section.text }}</text>
    </view>
    <view class="journal-help-demo">
      单机体验 · 验证码为 9999，不发送真实短信。
    </view>
  </view>
</template>
