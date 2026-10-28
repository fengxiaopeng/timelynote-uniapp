<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

definePage({ style: { navigationStyle: 'custom', navigationBarTitleText: '登录如期手记' } })
const failed = ref(false)
function login() {
  uni.redirectTo({
    url: '/pages/auth/login',
    fail: () => {
      failed.value = true
    },
  })
}
onLoad(login)
</script>

<template>
  <view class="journal-page editor-page">
    <view v-if="failed" class="empty-welcome">
      <view class="serif text-5">
        使用验证码继续记录
      </view><button role="button" class="primary-button mt-5" @click="login">
        前往登录
      </button>
    </view>
  </view>
</template>
