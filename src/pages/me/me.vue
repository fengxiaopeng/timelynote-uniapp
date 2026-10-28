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
async function draftActions() {
  const result = await uni.showActionSheet({ itemList: ['删除草稿'] }).catch(() => null)
  if (result?.tapIndex === 0)
    await discardDraft()
}
</script>

<template>
  <view class="journal-page feed-page account-page">
    <view class="account-header">
      <view>
        <view class="page-title">
          我的手账
        </view><view class="eyebrow">
          日子是自己的，回忆也是。
        </view>
      </view>
      <view class="account-seal" aria-hidden="true">
        如<br>期
      </view>
    </view>
    <view class="journal-content">
      <view class="paper account-profile">
        <view class="account-profile-top">
          <view class="account-avatar" aria-hidden="true">
            记
          </view>
          <view class="account-profile-copy">
            <view class="account-name">
              {{ maskedPhone }}
            </view><view class="account-caption">
              {{ auth.session ? '账号手账 · 本机保存' : '无需登录，也能慢慢记录。' }}
            </view>
          </view>
          <button v-if="!auth.session" role="button" class="account-login" aria-label="登录" @click="navigate({ url: '/pages/auth/login' })">
            登录 →
          </button>
        </view>
        <view class="account-stats">
          <view><text class="account-stat-number">{{ store.data.anniversaries.length }}</text><text>重要日子</text></view>
          <view><text class="account-stat-number">{{ store.data.notes.length }}</text><text>珍藏手记</text></view>
          <view><text class="account-stat-number">{{ photoCount }}</text><text>瞬间照片</text></view>
        </view>
      </view>

      <view class="account-section-heading">
        <text>重要的人</text><button role="button" class="account-all" aria-label="查看全部重要的人" @click="navigate({ url: '/pages/people/index' })">
          查看全部 →
        </button>
      </view>
      <view class="paper account-people">
        <scroll-view v-if="store.data.people.length" scroll-x :show-scrollbar="false" class="account-people-scroll">
          <view class="account-people-items">
            <button v-for="person in store.data.people" :key="person.id" role="button" class="account-person" :aria-label="`查看${person.name}`" @click="navigate({ url: `/pages/people/detail?id=${encodeURIComponent(person.id)}` })">
              <fg-person-avatar :src="person.avatar" :name="person.name" :size="40" /><text>{{ person.name }}</text>
            </button>
          </view>
        </scroll-view>
        <view v-else class="account-people-empty">
          从一个熟悉的称呼开始。
        </view>
        <button role="button" class="account-person account-person-add" aria-label="添加人物" @click="navigate({ url: '/pages/people/edit' })">
          <view>＋</view><text>添加</text>
        </button>
      </view>

      <view class="account-section-heading">
        <text>提醒偏好</text>
      </view>
      <view class="paper account-settings account-reminders">
        <picker mode="time" :value="store.data.preferences.time" @change="setting('time', $event.detail.value)">
          <button role="button" class="account-row" aria-label="默认提醒时间">
            <fg-journal-icon name="clock" /><text class="account-row-label">默认提醒时间</text><text class="account-row-value">{{ store.data.preferences.time }}</text><text class="account-chevron">›</text>
          </button>
        </picker>
        <picker :range="['当天', '1 天', '3 天', '7 天']" :value="[0, 1, 3, 7].indexOf(store.data.preferences.days)" @change="setting('days', [0, 1, 3, 7][Number($event.detail.value)])">
          <button role="button" class="account-row" aria-label="提前提醒">
            <fg-journal-icon name="bell" /><text class="account-row-label">提前提醒</text><text class="account-row-value">{{ store.data.preferences.days ? `${store.data.preferences.days} 天` : '当天' }}</text><text class="account-chevron">›</text>
          </button>
        </picker>
        <view class="account-row">
          <fg-journal-icon name="cal" /><text class="account-row-label">当天再提醒</text><switch class="account-switch" aria-label="当天再提醒" color="#b82c19" :checked="store.data.preferences.sameDay" @change="setting('sameDay', $event.detail.value)" />
        </view>
      </view>
      <view class="account-footnote">
        仅记录偏好，暂不发送系统通知。
      </view>

      <view class="account-section-heading">
        <text>数据与回忆</text>
      </view>
      <view class="paper account-settings account-data">
        <button role="button" class="account-row" @click="exportJournal(store.data)">
          <fg-journal-icon name="export" /><text class="account-row-label">导出备份</text><text class="account-chevron">›</text>
        </button>
        <button role="button" class="account-row" @click="restore">
          <fg-journal-icon name="sync" /><text class="account-row-label">恢复备份</text><text class="account-chevron">›</text>
        </button>
        <view v-if="store.data.draft" class="account-draft-row">
          <button role="button" class="account-row account-draft-main" @click="navigate({ url: '/pages/journal/compose?draft=1' })">
            <fg-journal-icon name="pen" /><text class="account-row-label">继续写草稿</text><text class="account-row-value">1 篇</text><text class="account-chevron">›</text>
          </button>
          <button role="button" class="account-draft-more" aria-label="草稿操作" @click="draftActions">
            ⋯
          </button>
        </view>
        <view v-else class="account-row">
          <fg-journal-icon name="pen" /><text class="account-row-label">草稿</text><text class="account-row-value">暂无草稿</text>
        </view>
      </view>
      <view class="account-footnote">
        回忆保存在本机，记得定期备份。
      </view>

      <button role="button" class="paper account-row account-about" @click="help = true">
        <fg-journal-icon name="help" /><text class="account-row-label">帮助与关于</text><text class="account-row-value">v{{ appInfo.version }}</text><text class="account-chevron">›</text>
      </button>
      <button v-if="auth.session" role="button" class="account-logout" @click="logout">
        退出当前账号
      </button>
      <view class="account-closing">
        <view />把时光，放在心上<view />
      </view>
    </view>

    <view v-if="help" class="modal-overlay account-help" role="dialog" aria-label="帮助与关于" @click.self="help = false">
      <view class="paper modal-panel">
        <view class="flex items-center justify-between">
          <text class="serif text-6">让记忆，如期而至</text><button role="button" class="icon-button" aria-label="关闭帮助" @click="help = false">
            ×
          </button>
        </view>
        <fg-journal-help compact />
        <button role="button" class="primary-button mt-5" @click="help = false">
          继续记录
        </button>
      </view>
    </view>
  </view>
</template>
