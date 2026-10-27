<script setup lang="ts">
import { onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { phoneAuthGateway } from '@/api/journal/auth'
import { useJournalStore } from '@/store/journal'
import { useLocalSessionStore } from '@/store/local-session'
import { back, toast } from '@/utils/journal-ui'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '登录如期手记' },
})
const phone = ref('')
const code = ref('')
const agreed = ref(false)
const seconds = ref(0)
const busy = ref(false)
const policy = ref('')
let timer: ReturnType<typeof setInterval> | undefined
onUnload(() => {
  if (timer)
    clearInterval(timer)
})
async function send() {
  if (seconds.value)
    return
  try {
    await phoneAuthGateway.sendCode(phone.value.trim())
    seconds.value = 60
    timer = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0)
        clearInterval(timer)
    }, 1000)
    toast('模拟验证码为 9999，不发送真实短信')
  }
  catch (error) {
    toast((error as Error).message)
  }
}
async function login() {
  if (busy.value)
    return
  if (!agreed.value) {
    toast('请先阅读并同意使用说明与隐私说明')
    return
  }
  busy.value = true
  try {
    const session = await phoneAuthGateway.login(
      phone.value.trim(),
      code.value.trim(),
    )
    useLocalSessionStore().session = session
    await useJournalStore().load()
    toast('欢迎回来，日子如期')
    uni.reLaunch({ url: '/pages/index/index' })
  }
  catch (error) {
    toast((error as Error).message)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <view class="journal-page login-page">
    <view class="editor-bar">
      <button role="button" class="icon-button" aria-label="返回" @click="back">
        <fg-journal-icon name="chevL" />
      </button><text class="eyebrow">如期手记</text><view class="w-11" />
    </view>
    <view class="login-content">
      <view class="brand-seal">
        如<br>期
      </view><view class="serif mt-7 text-9">
        把时光，<br>放在心上。
      </view><view class="muted mb-10 mt-3 text-3.5">
        登录后，继续书写属于你的日常。
      </view><label class="field-label" for="login-phone">手机号码</label><view class="login-field">
        <text class="muted">+86</text><input
          id="login-phone"
          v-model="phone"
          type="number"
          :maxlength="11"
          placeholder="请输入手机号码"
          aria-label="手机号码"
        >
      </view><label class="field-label mt-6" for="login-code">验证码</label><view class="login-field">
        <input
          id="login-code"
          v-model="code"
          type="number"
          :maxlength="4"
          placeholder="请输入 4 位验证码"
          aria-label="验证码"
        ><button
          role="button"
          class="text-button strong shrink-0"
          :disabled="seconds > 0"
          @click="send"
        >
          {{ seconds ? `${seconds}s 后重试` : "获取验证码" }}
        </button>
      </view><view class="notice mt-4">
        单机体验 · 验证码始终为 <strong>9999</strong>
      </view><view class="agreement mt-6">
        <checkbox-group
          @change="agreed = $event.detail.value.includes('agree')"
        >
          <label><checkbox
            value="agree"
            :checked="agreed"
            color="#b44232"
            aria-label="同意使用说明与隐私说明"
          /></label>
        </checkbox-group><view>
          我已阅读并同意<button
            role="button"
            class="inline-link"
            @click="policy = '使用说明'"
          >
            使用说明
          </button>与<button
            role="button"
            class="inline-link"
            @click="policy = '隐私说明'"
          >
            隐私说明
          </button>
        </view>
      </view><button
        role="button"
        class="primary-button mt-6"
        :disabled="busy"
        @click="login"
      >
        {{ busy ? "正在登录…" : "登录 / 开始记录" }}
      </button><view class="muted mt-6 text-center text-3 leading-6">
        本地模拟登录，不验证手机号归属。<br>记录保存在当前浏览器，不会自动上传或跨设备同步。<br>游客记录与各手机号的手账分别保存。
      </view>
    </view>
    <view v-if="policy" class="modal-overlay" @click.self="policy = ''">
      <view class="paper modal-panel">
        <view class="serif text-6">
          {{ policy }}
        </view><view class="mt-5 leading-8">
          {{
            policy === "隐私说明"
              ? "当前版本将手机号、登录状态、手记、照片和偏好保存在当前浏览器的本地存储中，不会发送到服务端。清理浏览器数据可能导致记录丢失，请定期导出备份。不同手机号在本机分开保存数据，但这不构成安全隔离，请勿在公共设备记录敏感信息。"
              : "当前为 H5 单机体验版，任意符合格式的手机号码与固定验证码 9999 都可登录，不发送真实短信。提醒仅保存设置，暂不发送通知。你可以创建、修改、删除及导出个人记录。"
          }}
        </view><button role="button" class="primary-button mt-6" @click="policy = ''">
          我知道了
        </button>
      </view>
    </view>
  </view>
</template>
