import type { LocalSession } from '@/api/journal/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { validPhone } from '@/api/journal/auth'

export const useLocalSessionStore = defineStore('timely-local-session-v1', () => {
  const session = ref<LocalSession | null>(null)
  return { session }
}, {
  persist: {
    serializer: {
      serialize: JSON.stringify,
      deserialize(raw) {
        try {
          const data = JSON.parse(raw)
          return { session: data?.session?.mode === 'local-demo' && typeof data.session.phone === 'string' && validPhone(data.session.phone) ? data.session : null }
        }
        catch {
          return { session: null }
        }
      },
    },
  },
})
