<script setup lang="ts">
import { journalAsset } from '@/utils/journal-assets'

defineProps<{
  name: string
}>()
</script>

<template>
  <image
    class="journal-icon"
    :src="journalAsset(name)"
    mode="aspectFit"
    aria-hidden="true"
  />
</template>

<style scoped>
.journal-icon {
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
