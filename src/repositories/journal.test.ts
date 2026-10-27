import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankNote, emptyJournal } from '@/domain/journal'
import { journalRepository } from './journal'

let storage: Map<string, string>
function boot() {
  const pinia = createPinia()
  pinia.use(createPersistedState({ storage: { getItem: uni.getStorageSync, setItem: uni.setStorageSync } }))
  createApp({}).use(pinia)
  setActivePinia(pinia)
}
beforeEach(() => {
  storage = new Map()
  vi.mocked(uni.getStorageSync).mockImplementation(key => storage.get(key) || '')
  vi.mocked(uni.setStorageSync).mockImplementation((key, value) => {
    storage.set(key, value)
  })
  boot()
})
describe('本地仓储持久化边界', () => {
  it('真正持久化并在新的 Pinia 实例中恢复', async () => {
    const data = emptyJournal()
    data.notes.push({ ...blankNote(), content: '保留这个瞬间' })
    await journalRepository.save('guest', data)
    boot()
    expect((await journalRepository.load('guest')).notes[0].content).toBe('保留这个瞬间')
    expect((await journalRepository.load('13800138000')).notes).toHaveLength(0)
  })
  it('保存失败时仓储也回滚，重新打开不会误显示失败的记录', async () => {
    await journalRepository.save('guest', emptyJournal())
    const data = emptyJournal()
    data.notes.push({ ...blankNote(), content: '保存失败的内容' })
    vi.mocked(uni.setStorageSync).mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    await expect(journalRepository.save('guest', data)).rejects.toThrow('本地保存失败')
    expect((await journalRepository.load('guest')).notes).toHaveLength(0)
  })
  it('损坏的本地记录不会进入业务层', async () => {
    storage.set('timely-journal-v1', JSON.stringify({ accounts: { guest: { notes: ['broken'] } } }))
    boot()
    expect(await journalRepository.load('guest')).toEqual(emptyJournal())
  })
})
