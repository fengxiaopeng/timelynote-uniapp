import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blankNote, emptyJournal } from '@/domain/journal'
import { journalRepository } from '@/repositories/journal'
import { useJournalStore } from './journal'
import { useLocalSessionStore } from './local-session'

vi.mock('@/repositories/journal', async (original) => {
  const actual = await original<typeof import('@/repositories/journal')>()
  return { ...actual, journalRepository: { load: vi.fn(), save: vi.fn() } }
})
beforeEach(() => {
  vi.mocked(journalRepository.load).mockResolvedValue(emptyJournal())
  vi.mocked(journalRepository.save).mockResolvedValue()
})
describe('手账业务与账号隔离', () => {
  it('删除纪念日保留手记，解除关联', async () => {
    const store = useJournalStore()
    await store.addSamples()
    const before = store.data.notes.length
    await store.deleteEvent('sample-child')
    expect(store.data.notes).toHaveLength(before)
    expect(store.data.notes.find(note => note.id === 'sample-sea')?.anniversaryId).toBe('')
  })
  it('保存失败保留旧状态，重试不产生重复记录', async () => {
    const store = useJournalStore()
    const note = { ...blankNote(), content: '今天很好' }
    vi.mocked(journalRepository.save).mockRejectedValueOnce(new Error('空间不足'))
    await expect(store.saveNote(note)).rejects.toThrow('空间不足')
    expect(store.data.notes).toHaveLength(0)
    await store.saveNote(note)
    await store.saveNote(note)
    expect(store.data.notes).toHaveLength(1)
  })
  it('游客与手机号通过不同 owner 读取；切换后不保留前账号数据', async () => {
    const store = useJournalStore()
    await store.addSamples()
    await store.load()
    expect(journalRepository.load).toHaveBeenLastCalledWith('guest')
    useLocalSessionStore().session = { phone: '13800138000', mode: 'local-demo' }
    await store.load()
    expect(journalRepository.load).toHaveBeenLastCalledWith('13800138000')
    expect(store.data.notes).toHaveLength(0)
  })
})

it('人物生日从纪念日入口修改，人物读取同一日期且只更新该纪念日', async () => {
  const store = useJournalStore()
  const person = { id: 'child', name: '小满', relationship: '孩子', remark: '', archived: false, birthdayEventId: '' }
  await store.savePerson(person, { date: '2026-01-20', yearUnknown: false })
  const birthdayId = store.data.people[0].birthdayEventId
  await store.saveEvent({ ...store.data.anniversaries[0], date: '2026-01-21', personIds: [] })
  expect(store.data.anniversaries).toHaveLength(1)
  expect(store.data.anniversaries[0].id).toBe(birthdayId)
  expect(store.data.anniversaries[0].date).toBe('2026-01-21')
  expect(store.data.anniversaries[0].personIds).toContain('child')
  await store.deleteEvent(birthdayId)
  expect(store.data.people[0].birthdayEventId).toBe('')
})

it('保存人物失败不会留下半个生日或人物；账号切换清空人物展示', async () => {
  const store = useJournalStore()
  const person = { id: 'child', name: '小满', relationship: '孩子', remark: '', archived: false, birthdayEventId: '' }
  vi.mocked(journalRepository.save).mockRejectedValueOnce(new Error('空间不足'))
  await expect(store.savePerson(person, { date: '2026-01-20', yearUnknown: false })).rejects.toThrow('空间不足')
  expect(store.data.people).toHaveLength(0)
  expect(store.data.anniversaries).toHaveLength(0)
  await store.savePerson(person, null)
  useLocalSessionStore().session = { phone: '13800138000', mode: 'local-demo' }
  await store.load()
  expect(store.data.people).toHaveLength(0)
})
