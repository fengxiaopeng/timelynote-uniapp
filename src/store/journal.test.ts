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
    expect(
      store.data.notes.find(note => note.id === 'sample-sea')?.anniversaryId,
    ).toBe('')
  })
  it('保存失败保留旧状态，重试不产生重复记录', async () => {
    const store = useJournalStore()
    const note = { ...blankNote(), content: '今天很好' }
    vi.mocked(journalRepository.save).mockRejectedValueOnce(
      new Error('空间不足'),
    )
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
    useLocalSessionStore().session = {
      phone: '13800138000',
      mode: 'local-demo',
    }
    await store.load()
    expect(journalRepository.load).toHaveBeenLastCalledWith('13800138000')
    expect(store.data.notes).toHaveLength(0)
  })
})

it('人物生日从纪念日入口修改，人物读取同一日期且只更新该纪念日', async () => {
  const store = useJournalStore()
  const person = {
    id: 'child',
    name: '小满',
    avatar: '',
    remark: '',
    archived: false,
    birthdayEventId: '',
  }
  await store.savePerson(person, { date: '2026-01-20', yearUnknown: false })
  const birthdayId = store.data.people[0].birthdayEventId
  await store.saveEvent({
    ...store.data.anniversaries[0],
    date: '2026-01-21',
    personIds: [],
  })
  expect(store.data.anniversaries).toHaveLength(1)
  expect(store.data.anniversaries[0].id).toBe(birthdayId)
  expect(store.data.anniversaries[0].date).toBe('2026-01-21')
  expect(store.data.anniversaries[0].personIds).toContain('child')
  await store.deleteEvent(birthdayId)
  expect(store.data.people[0].birthdayEventId).toBe('')
})

it('保存人物失败不会留下半个生日或人物；账号切换清空人物展示', async () => {
  const store = useJournalStore()
  const person = {
    id: 'child',
    name: '小满',
    avatar: '',
    remark: '',
    archived: false,
    birthdayEventId: '',
  }
  vi.mocked(journalRepository.save).mockRejectedValueOnce(
    new Error('空间不足'),
  )
  await expect(
    store.savePerson(person, { date: '2026-01-20', yearUnknown: false }),
  ).rejects.toThrow('空间不足')
  expect(store.data.people).toHaveLength(0)
  expect(store.data.anniversaries).toHaveLength(0)
  await store.savePerson(person, null)
  useLocalSessionStore().session = { phone: '13800138000', mode: 'local-demo' }
  await store.load()
  expect(store.data.people).toHaveLength(0)
})

it('并行新增标签和保存手记不会互相覆盖，失败后仍可继续保存', async () => {
  const store = useJournalStore()
  const note = { ...blankNote(), content: '今天很好' }
  await Promise.all([store.saveTag('周末'), store.saveNote(note)])
  expect(store.data.tagLibrary).toContain('周末')
  expect(store.data.notes).toHaveLength(1)
  vi.mocked(journalRepository.save).mockRejectedValueOnce(
    new Error('空间不足'),
  )
  await expect(store.saveTag('未成功标签')).rejects.toThrow('空间不足')
  expect(store.data.tagLibrary).not.toContain('未成功标签')
  await store.saveTag('下次再记')
  expect(store.data.tagLibrary).toContain('下次再记')
})

it('保留旧纪念日文字照片及专属标签；生日标签不可丢失', async () => {
  const store = useJournalStore()
  const person = {
    id: 'child',
    name: '小满',
    avatar: '',
    remark: '',
    archived: false,
    birthdayEventId: '',
  }
  await store.savePerson(person, { date: '2026-01-20', yearUnknown: false })
  const event = {
    ...store.data.anniversaries[0],
    description: '一起准备生日蛋糕',
    tags: ['生日计划'],
    images: ['data:image/jpeg;base64,AA=='],
  }
  await store.saveEvent(event)
  expect(store.data.notes).toHaveLength(0)
  expect(store.data.eventTagLibrary).toContain('生日计划')
  expect(store.data.tagLibrary).not.toContain('生日计划')
  await store.savePerson(store.data.people[0], {
    date: '2026-01-21',
    yearUnknown: false,
  })
  expect(store.data.anniversaries[0].description).toBe('一起准备生日蛋糕')
  expect(store.data.anniversaries[0].images).toEqual(event.images)
  expect(store.data.anniversaries[0].tags).toEqual([...event.tags, '生日'])
})

it('同名标签并行创建复用同一大小写，切换账号后标签独立', async () => {
  const store = useJournalStore()
  expect(
    await Promise.all([store.saveTag('Travel'), store.saveTag('travel')]),
  ).toEqual(['Travel', 'Travel'])
  expect(
    store.data.tagLibrary.filter(tag => tag.toLowerCase() === 'travel'),
  ).toHaveLength(1)
  useLocalSessionStore().session = { phone: '13800138000', mode: 'local-demo' }
  await store.load()
  expect(store.data.tagLibrary).not.toContain('Travel')
})

it('纪念日来源手记独立保存，纪念日移除后保留正文并解除关联', async () => {
  const store = useJournalStore()
  await store.addSamples()
  const event = store.data.anniversaries[0]
  const note = { ...blankNote(), title: event.title, content: '这一年的回忆', personIds: [...(event.personIds || [])], anniversaryId: event.id }
  await store.saveNote(note)
  expect(store.data.notes.find(item => item.id === note.id)?.anniversaryId).toBe(event.id)
  await store.deleteEvent(event.id)
  expect(store.data.notes.find(item => item.id === note.id)?.content).toBe('这一年的回忆')
  expect(store.data.notes.find(item => item.id === note.id)?.anniversaryId).toBe('')
  const stale = { ...blankNote(), content: '编辑期间纪念日被删除', anniversaryId: event.id }
  await store.saveNote(stale)
  expect(store.data.notes.find(item => item.id === stale.id)?.anniversaryId).toBe('')
})
it('手记与纪念日标签并行新建，各自持久化且不互相覆盖', async () => {
  const store = useJournalStore()
  await Promise.all([store.saveTag('手记独有'), store.saveTag('纪念日独有', 'event')])
  expect(store.data.tagLibrary).toContain('手记独有')
  expect(store.data.tagLibrary).not.toContain('纪念日独有')
  expect(store.data.eventTagLibrary).toContain('纪念日独有')
  expect(store.data.eventTagLibrary).not.toContain('手记独有')
})
