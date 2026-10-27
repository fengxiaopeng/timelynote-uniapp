<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useJournalStore } from '@/store/journal'
import { back, toast } from '@/utils/journal-ui'
import PersonEditor from './components/PersonEditor.vue'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '人物资料' },
})
const store = useJournalStore()
const id = ref('')
const ready = ref(false)
onLoad(async (options) => {
  await store.load()
  id.value = typeof options?.id === 'string' ? options.id : ''
  if (id.value && !store.data.people.some(person => person.id === id.value)) {
    toast('这个人物已不存在')
    back()
    return
  }
  ready.value = true
})
</script>

<template>
  <view class="journal-page editor-page">
    <view class="journal-content form-content">
      <PersonEditor
        v-if="ready"
        :person-id="id || undefined"
        @saved="back"
        @cancel="back"
      />
    </view>
  </view>
</template>
