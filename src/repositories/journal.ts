import type { JournalData } from '@/domain/journal'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { emptyJournal, validJournal } from '@/domain/journal'

export interface JournalRepository {
  load: (owner: string) => Promise<JournalData>
  save: (owner: string, data: JournalData) => Promise<void>
}
/** 持久化由项目统一的 Pinia 插件完成，业务层不依赖 localStorage/uni Storage。 */
const useDatabase = defineStore('timely-journal-v1', () => {
  const accounts = ref<Record<string, JournalData>>({})
  return { accounts }
}, {
  persist: {
    serializer: {
      serialize: JSON.stringify,
      deserialize(raw) {
        const accounts: Record<string, JournalData> = {}
        try {
          const data = JSON.parse(raw)
          if (data?.accounts && typeof data.accounts === 'object') {
            for (const [key, value] of Object.entries(data.accounts)) {
              if ((key === 'guest' || /^1[3-9]\d{9}$/.test(key)) && validJournal(value))
                accounts[key] = value
            }
          }
        }
        catch { /* 损坏的持久化数据不进入业务层。 */ }
        return { accounts }
      },
    },
  },
})
export function cloneJournal(data: JournalData): JournalData {
  return JSON.parse(JSON.stringify(data))
}
export const journalRepository: JournalRepository = {
  async load(owner) {
    return cloneJournal(useDatabase().accounts[owner] ?? emptyJournal())
  },
  async save(owner, data) {
    if (!validJournal(data))
      throw new Error('记录格式不正确，请检查日期和内容')
    const database = useDatabase()
    const previous = database.accounts
    database.accounts = { ...previous, [owner]: cloneJournal(data) }
    // 显式同步持久化后读回确认，存储配额满时保留原状态及编辑器内容。
    try {
      database.$persist()
      const raw = uni.getStorageSync('timely-journal-v1')
      if (typeof raw !== 'string' || raw !== JSON.stringify({ accounts: database.accounts }))
        throw new Error('Storage write was not confirmed')
    }
    catch {
      database.accounts = previous
      database.$persist()
      throw new Error('本地保存失败，可能是存储空间不足，请减少照片后重试')
    }
  },
}
