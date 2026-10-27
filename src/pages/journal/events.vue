<script setup lang="ts">
import JournalFeed from '@/pages/journal/components/JournalFeed.vue'

definePage({
  style: { navigationStyle: 'custom', navigationBarTitleText: '如期手记' },
})
</script>

<template>
  <JournalFeed mode="events" />
</template>
