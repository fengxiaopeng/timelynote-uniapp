<script setup lang="ts">
import { confirmAction, navigate, toast } from '@/utils/journal-ui'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { appInfo } from '@/config/app'
import { useJournalStore } from '@/store/journal'
import { useLocalSessionStore } from '@/store/local-session'
import { exportJournal, importJournal } from '@/utils/journal-backup'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '我的手账' },
})
const store = useJournalStore()
const auth = useLocalSessionStore()
const help = ref(false)
const photoCount = computed(
  () =>
    store.data.notes.reduce((sum, note) => sum + note.images.length, 0)
    + store.data.anniversaries.reduce(
      (sum, event) => sum + (event.images?.length || 0),
      0,
    ),
)
const maskedPhone = computed(() =>
  auth.session
    ? `${auth.session.phone.slice(0, 3)} ···· ${auth.session.phone.slice(-4)}`
    : '游客手账',
)
onShow(() => {
  void store.load()
})
async function setting(
  key: 'time' | 'days' | 'sameDay',
  value: string | number | boolean,
) {
  try {
    await store.update((next) => {
      Object.assign(next.preferences, { [key]: value })
    })
  }
  catch (error) {
    toast((error as Error).message)
  }
}
async function logout() {
  if (
    !(await confirmAction(
      '退出当前账号？',
      '当前账号的本地手账会保留。退出后返回独立的游客手账，再次登录相同手机号即可继续查看。',
    ))
  ) {
    return
  }
  auth.session = null
  await store.load()
  toast('已退出，回到游客手账')
}
function restore() {
  importJournal(
    async (data) => {
      if (
        !(await confirmAction(
          '用备份替换当前手账？',
          '将覆盖当前身份下的手记、纪念日和设置。建议先导出当前备份，此操作无法撤销。',
        ))
      ) {
        return
      }
      try {
        await store.update(next => Object.assign(next, data))
        toast('手账已从备份恢复')
      }
      catch (error) {
        toast((error as Error).message)
      }
    },
    error => toast(error.message),
  )
}
async function discardDraft() {
  if (!(await confirmAction('删除草稿？', '这篇尚未存下的草稿将无法恢复。')))
    return
  try {
    await store.update((next) => {
      next.draft = null
    })
    toast('草稿已删除')
  }
  catch (error) {
    toast((error as Error).message)
  }
}
</script>

<template>
  <view class="journal-page feed-page">
    <view class="journal-appbar">
      <view>
        <view class="page-title">
          我的手账
        </view><view class="eyebrow">
          日子是自己的，回忆也是。
        </view>
      </view><view class="small-seal">
        如期
      </view>
    </view>
    <view class="journal-content">
      <view class="profile-card">
        <view class="profile-avatar">
          记
        </view><view class="flex-1">
          <view class="serif text-6">
            {{ maskedPhone }}
          </view><view class="muted mt-1 text-3">
            {{
              auth.session
                ? "本地模拟账号 · 仅当前浏览器"
                : "无需登录，也能慢慢记录"
            }}
          </view>
        </view><button
          v-if="!auth.session"
          role="button"
          class="text-button strong"
          @click="navigate({ url: '/pages/auth/login' })"
        >
          登录 →
        </button>
      </view>
      <view class="stats-row">
        <view>
          <text class="stat-number">{{ store.data.anniversaries.length }}</text><text>重要日子</text>
        </view><view>
          <text class="stat-number">{{ store.data.notes.length }}</text><text>珍藏手记</text>
        </view><view>
          <text class="stat-number">
            {{ photoCount }}
          </text><text>瞬间照片</text>
        </view>
      </view>
      <view class="section-label">
        提醒偏好
      </view><view class="paper settings-group">
        <picker
          mode="time"
          :value="store.data.preferences.time"
          @change="setting('time', $event.detail.value)"
        >
          <view class="settings-row">
            <fg-journal-icon name="clock" /><text class="flex-1">
              默认提醒时刻
            </text><text>{{ store.data.preferences.time }} ›</text>
          </view>
        </picker><view class="settings-row flex-wrap">
          <fg-journal-icon name="bell" /><text>默认提前天数</text><view class="chips mt-2 w-full">
            <button
              v-for="days in [0, 1, 3, 7]"
              :key="days"
              role="button"
              class="chip"
              :class="{ selected: store.data.preferences.days === days }"
              @click="setting('days', days)"
            >
              {{ days ? `${days} 天` : "当天" }}
            </button>
          </view>
        </view><view class="settings-row">
          <fg-journal-icon name="cal" /><text class="flex-1">
            当天再提醒一次
          </text><switch
            color="#b44232"
            :checked="store.data.preferences.sameDay"
            @change="setting('sameDay', $event.detail.value)"
          />
        </view>
      </view><view class="notice mt-3">
        偏好用于新建纪念日，已有纪念日保留各自规则。当天提醒为全局偏好。当前版本暂不发送通知。
      </view>
      <view class="section-label mt-7">
        放在心上的人
      </view><view class="paper settings-group">
        <button
          role="button"
          class="settings-row"
          @click="navigate({ url: '/pages/people/index' })"
        >
          <fg-journal-icon name="heart" /><text class="flex-1">重要的人</text><text class="muted text-3">
            {{
              store.data.people.length
            }}
            位 ›
          </text>
        </button>
      </view>
      <view class="section-label mt-7">
        数据与回忆
      </view><view class="paper settings-group">
        <button
          role="button"
          class="settings-row"
          @click="exportJournal(store.data)"
        >
          <fg-journal-icon name="export" /><text class="flex-1">
            导出手账备份
          </text><text class="muted text-3">JSON ›</text>
        </button><button role="button" class="settings-row" @click="restore">
          <fg-journal-icon name="sync" /><text class="flex-1">从备份恢复</text><text>›</text>
        </button><view v-if="store.data.draft" class="settings-row">
          <fg-journal-icon name="pen" /><button
            role="button"
            class="text-button flex-1 text-left"
            @click="navigate({ url: '/pages/journal/compose?draft=1' })"
          >
            继续写草稿
          </button><button role="button" class="text-button" @click="discardDraft">
            删除
          </button>
        </view><view v-else class="settings-row">
          <fg-journal-icon name="pen" /><text class="flex-1">草稿</text><text class="muted text-3">暂未留下草稿</text>
        </view><view class="settings-row">
          <fg-journal-icon name="lock" /><view>
            <view>本地保存</view><view class="muted mt-1 text-3">
              尚未接入云同步 · 清理浏览器前请备份
            </view>
          </view>
        </view>
      </view>
      <view class="section-label mt-7">
        关于如期
      </view><view class="paper settings-group">
        <button role="button" class="settings-row" @click="help = true">
          <fg-journal-icon name="help" /><text class="flex-1">
            使用帮助与版本说明
          </text><text>›</text>
        </button><view class="settings-row">
          <text class="flex-1">如期手记 · H5 单机版</text><text class="muted text-3">v{{ appInfo.version }}</text>
        </view>
      </view><button
        v-if="auth.session"
        role="button"
        class="outline-button my-6"
        @click="logout"
      >
        退出当前账号
      </button><view class="feed-footer">
        把未来的期待与过去的瞬间，<br>安放在同一页时光里。
      </view>
    </view>
    <view v-if="help" class="modal-overlay" @click.self="help = false">
      <view class="paper modal-panel">
        <view class="serif text-6">
          让记忆，如期而至
        </view><view class="mt-5 text-3.5 leading-8">
          点击底部「＋」写手记或添加纪念日。纪念日支持公历年度重复；2 月 29
          日在非闰年按 2 月 28
          日计算。手记独立记录日常；纪念日可直接补充文字、照片和标签。人物和标签直接点选即可。<br><br>验证码固定为
          9999。游客和各手机号使用独立本地手账，不会自动迁移记录。退出后再次登录相同号码可恢复本机手账。<br><br>数据和照片保存在当前浏览器。建议定期导出
          JSON 备份；当前未接入短信、云同步、系统通知、图片与链接分享。
        </view><button
          role="button"
          class="primary-button mt-6"
          @click="help = false"
        >
          继续记录
        </button>
      </view>
    </view>
  </view>
</template>
