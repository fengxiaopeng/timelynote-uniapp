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
const search = ref('')
const archived = ref(false)
const paging = ref<{
  setLocalPaging: (items: Person[]) => Promise<unknown>
  clear: () => void
  pageReachBottom: () => void
} | null>(null)
const visible = ref<Person[]>([])
const people = computed(() =>
  store.data.people.filter(
    person =>
      person.archived === archived.value
      && `${person.name} ${person.relationship}`.includes(search.value.trim()),
  ),
)
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
  <view class="journal-page editor-page">
    <view class="editor-bar">
      <button
        role="button"
        class="icon-button"
        aria-label="返回"
        @click="back"
      >
        <fg-journal-icon name="chevL" />
      </button><text class="serif text-6">重要的人</text><button
        role="button"
        class="icon-button"
        aria-label="添加人物"
        @click="navigate({ url: '/pages/people/edit' })"
      >
        ＋
      </button>
    </view><view class="journal-content form-content">
      <view class="muted mb-5 text-3.5">
        那些想记住的日子，都与他们有关。
      </view><view class="search-box">
        <input
          v-model="search"
          placeholder="搜索称呼或关系"
          aria-label="搜索重要的人"
        >
      </view><view class="chips mb-5">
        <button
          role="button"
          class="chip"
          :class="{ selected: !archived }"
          @click="archived = false"
        >
          记在心上
        </button><button
          role="button"
          class="chip"
          :class="{ selected: archived }"
          @click="archived = true"
        >
          已归档
        </button>
      </view><z-paging
        ref="paging"
        v-model="visible"
        :fixed="false"
        :auto="false"
        :use-page-scroll="true"
        :refresher-enabled="false"
        :hide-empty-view="true"
        :show-loading-more-no-more-view="false"
      >
        <button
          v-for="person in visible"
          :key="person.id"
          role="button"
          class="paper person-list-card"
          @click="
            navigate({
              url: `/pages/people/detail?id=${encodeURIComponent(person.id)}`,
            })
          "
        >
          <text class="person-avatar">{{ person.name.slice(0, 1) }}</text><view class="flex-1">
            <view class="serif text-6">
              {{ person.name }}
            </view><view class="muted mt-1 text-3">
              {{ person.relationship || "重要的人" }} ·
              {{ birthdayLabel(birthdayOf(store.data, person)) }}
            </view>
          </view><text>›</text>
        </button>
      </z-paging><view v-if="!people.length" class="small-empty">
        {{
          search
            ? "没有找到这位人物。"
            : archived
              ? "暂时没有归档的人物。"
              : "还没有记下人物，从一个熟悉的称呼开始吧。"
        }}
      </view><button
        v-if="!archived"
        role="button"
        class="primary-button mt-6"
        @click="navigate({ url: '/pages/people/edit' })"
      >
        添加一位重要的人
      </button>
    </view>
  </view>
</template>
