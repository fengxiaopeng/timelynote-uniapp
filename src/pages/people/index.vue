<script setup lang="ts">
import type { Person } from '@/domain/journal'
import { onReachBottom, onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { birthdayLabel, birthdayOf } from '@/domain/people'
import { useJournalStore } from '@/store/journal'
import { back, navigate } from '@/utils/journal-ui'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '重要的人' },
})
const store = useJournalStore()
const paging = ref<{
  setLocalPaging: (items: Person[]) => Promise<unknown>
  clear: () => void
  pageReachBottom: () => void
} | null>(null)
const visible = ref<Person[]>([])
const people = computed(() => store.data.people)
watch(
  [people, paging],
  () => {
    if (paging.value) {
      paging.value.clear()
      void paging.value.setLocalPaging(people.value)
    }
  },
  { immediate: true },
)
onShow(() => {
  void store.load()
})
onReachBottom(() => paging.value?.pageReachBottom())
</script>

<template>
  <view class="journal-page editor-page people-list-page">
    <view class="editor-bar">
      <button
        role="button"
        class="icon-button"
        aria-label="返回"
        @click="back"
      >
        <fg-journal-icon name="chevL" />
      </button><text class="people-list-name">重要的人</text><button
        role="button"
        class="text-button strong"
        aria-label="添加人物"
        @click="navigate({ url: '/pages/people/edit' })"
      >
        ＋ 添加
      </button>
    </view><view class="journal-content form-content">
      <view class="muted mb-5 text-3.5">
        那些想记住的日子，都与他们有关。
      </view><view v-if="people.length" class="paper people-list-panel">
        <z-paging
          ref="paging"
          v-model="visible"
          :fixed="false"
          :auto="false"
          :auto-full-height="false"
          :use-page-scroll="true"
          :refresher-enabled="false"
          :hide-empty-view="true"
          :show-loading-more-no-more-view="false"
        >
          <button
            v-for="person in visible"
            :key="person.id"
            role="button"
            class="people-list-row"
            @click="
              navigate({
                url: `/pages/people/detail?id=${encodeURIComponent(person.id)}`,
              })
            "
          >
            <fg-person-avatar :name="person.name" :src="person.avatar" :size="42" /><view class="flex-1">
              <view class="people-list-name">
                {{ person.name }}
              </view><view class="people-list-birthday">
                {{ birthdayLabel(birthdayOf(store.data, person)) }}
              </view>
            </view><text>›</text>
          </button>
        </z-paging>
      </view><view v-if="!people.length" class="small-empty">
        还没有记下人物，从一个熟悉的称呼开始吧。
      </view><button
        v-if="!people.length"
        role="button"
        class="primary-button mt-6"
        @click="navigate({ url: '/pages/people/edit' })"
      >
        添加一位重要的人
      </button>
    </view>
  </view>
</template>
