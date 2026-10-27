<script setup lang="ts">
import {
  back,
  confirmAction,
  navigate,
  previewImage,
  toast,
} from '@/utils/journal-ui'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { dateLabel } from '@/domain/journal'
import { useJournalStore } from '@/store/journal'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '时刻详情' },
})
const store = useJournalStore()
const id = ref('')
const note = computed(() =>
  store.data.notes.find(item => item.id === id.value),
)
const event = computed(() =>
  store.data.anniversaries.find(
    item => item.id === note.value?.anniversaryId,
  ),
)
onLoad((options) => {
  id.value = typeof options?.id === 'string' ? options.id : ''
})
onShow(() => {
  void store.load()
})
async function remove() {
  if (
    !(await confirmAction(
      '删除这篇手记？',
      '删除后无法恢复，请确认这段回忆已不再需要。',
    ))
  ) {
    return
  }
  try {
    await store.deleteNote(id.value)
    toast('手记已删除')
    back()
  }
  catch (error) {
    toast((error as Error).message)
  }
}
function copy() {
  if (!note.value)
    return
  uni.setClipboardData({
    data: `${note.value.title || '一页日常'}\n${note.value.date}\n\n${note.value.content}\n\n—— 如期手记`,
    success: () => toast('手记文字已复制，可自行分享'),
    fail: () => toast('复制失败，请检查浏览器剪贴板权限'),
  })
}
</script>

<template>
  <view class="journal-page detail-page">
    <view class="editor-bar">
      <button role="button" class="icon-button" aria-label="返回" @click="back">
        <fg-journal-icon name="chevL" />
      </button><text class="muted text-3">留住这一刻</text><button
        v-if="note"
        role="button"
        class="icon-button"
        aria-label="删除手记"
        @click="remove"
      >
        ×
      </button>
    </view>
    <template v-if="note">
      <image
        v-if="note.images.length"
        class="detail-cover"
        :src="note.images[0]"
        mode="aspectFill"
        @click="previewImage({ urls: note.images, current: note.images[0] })"
      /><view
        v-else-if="note.id === 'sample-sea'"
        class="detail-cover photo--sea"
      />
      <view
        class="note-detail-paper"
        :class="{ 'has-cover': note.images.length || note.id === 'sample-sea' }"
      >
        <view class="eyebrow">
          {{ dateLabel(note.date) }}
        </view><view class="serif my-5 text-8 leading-snug">
          {{ note.title || "一页日常" }}
        </view><view
          v-if="note.place || note.weather"
          class="muted mb-5 flex items-center gap-2 text-3"
        >
          <fg-journal-icon name="pin" />{{ note.place
          }}<text class="ml-auto">{{ note.weather }}</text>
        </view><view v-if="note.personIds?.length" class="mb-5">
          <view class="field-label">
            一起记得
          </view><fg-person-tags :ids="note.personIds" />
        </view>
        <view class="detail-body">
          {{ note.content }}
        </view><view v-if="note.images.length > 1" class="detail-gallery">
          <image
            v-for="(src, index) in note.images.slice(1)"
            :key="index"
            :src="src"
            mode="widthFix"
            @click="previewImage({ urls: note.images, current: src })"
          />
        </view><view class="my-6 flex flex-wrap gap-2">
          <text v-for="tag in note.tags" :key="tag" class="note-tag">
            {{
              tag
            }}
          </text><text v-if="note.sample" class="sample-label">示例手记</text>
        </view><button
          v-if="event"
          role="button"
          class="linked-card"
          @click="
            navigate({
              url: `/pages/journal/event-detail?id=${encodeURIComponent(event.id)}`,
            })
          "
        >
          <fg-journal-icon name="link" /><view>
            <view>写给 · {{ event.title }}</view><view class="muted mt-1 text-3">
              关联 {{ note.occurrence }} 这一次
            </view>
          </view><text class="ml-auto">→</text>
        </button><view class="detail-signature">
          日子有迹，念念如期。
        </view>
      </view>
      <view class="detail-actions">
        <button
          role="button"
          class="outline-button flex-1"
          @click="
            navigate({
              url: `/pages/journal/compose?id=${encodeURIComponent(id)}`,
            })
          "
        >
          <fg-journal-icon name="edit" />修改与关联
        </button><button role="button" class="outline-button" @click="copy">
          <fg-journal-icon name="share" />复制文字
        </button>
      </view>
    </template>
    <view v-else-if="!store.loading" class="empty-welcome">
      <view class="serif text-6">
        这篇手记已不在这里
      </view><button role="button" class="primary-button mt-6" @click="back">
        返回手账
      </button>
    </view>
  </view>
</template>
