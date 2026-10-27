<script setup lang="ts">
import JournalFeed from '@/pages/journal/components/JournalFeed.vue'

definePage({ type: 'home', style: { navigationStyle: 'custom', navigationBarTitleText: '如期手记' } })
</script>

<template>
  <JournalFeed mode="home" />
</template>
