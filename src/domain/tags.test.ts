import { describe, expect, it } from 'vitest'
import {
  blankNote,
  emptyJournal,
  migrateJournal,
  validJournal,
} from './journal'
import { addTag, normalizeTag } from './tags'

describe('直接点选与新建标签', () => {
  it('规范名称，拒绝空白和过长标签，重复名称复用原标签', () => {
    const data = emptyJournal()
    expect(normalizeTag('  # 周末   出游  ')).toBe('周末 出游')
    expect(() => addTag(data, '   #  ')).toThrow('标签名称')
    expect(() => addTag(data, '很'.repeat(21))).toThrow('20')
    expect(addTag(data, 'Travel')).toBe('Travel')
    expect(addTag(data, 'travel')).toBe('Travel')
    expect(
      data.tagLibrary.filter(tag => tag.toLowerCase() === 'travel'),
    ).toHaveLength(1)
  })
  it('旧手记移除天气，保留正文、照片、人物和历史归属，并收录历史标签', () => {
    const note = {
      ...blankNote(),
      content: '旧的回忆',
      weather: '晴',
      anniversaryId: 'legacy-event',
      occurrence: '2025-11-14',
      tags: ['旧标签'],
    }
    const legacy = {
      people: [],
      anniversaries: [],
      notes: [note],
      draft: { ...note, id: 'draft' },
      preferences: emptyJournal().preferences,
    }
    const data = migrateJournal(legacy)!
    expect(data.notes[0]).not.toHaveProperty('weather')
    expect(data.draft).not.toHaveProperty('weather')
    expect(data.notes[0].anniversaryId).toBe('legacy-event')
    expect(data.notes[0].content).toBe('旧的回忆')
    expect(data.tagLibrary).toContain('旧标签')
    expect(validJournal(data)).toBe(true)
  })
  it('校验纪念日新增的照片和标签；拒绝损坏的标签库', () => {
    const data = emptyJournal()
    data.anniversaries.push({
      id: 'event',
      title: '周年',
      date: '2026-11-14',
      category: '纪念',
      repeat: 'yearly',
      reminderDays: 7,
      reminderTime: '09:00',
      pinned: false,
      description: '关于这一天',
      tags: ['仪式感'],
      images: ['data:image/jpeg;base64,AA=='],
    })
    expect(validJournal(data)).toBe(true)
    expect(migrateJournal(data)?.eventTagLibrary).toContain('仪式感')
    expect(migrateJournal(data)?.tagLibrary).not.toContain('仪式感')
    expect(validJournal({ ...data, tagLibrary: ['日常', 3] })).toBe(false)
    expect(
      validJournal({
        ...data,
        anniversaries: [
          { ...data.anniversaries[0], images: ['javascript:alert(1)'] },
        ],
      }),
    ).toBe(false)
  })
})

it('手记和纪念日标签独立新建，同名标签各自复用', () => {
  const data = emptyJournal()
  addTag(data, '手记专属')
  addTag(data, '生日计划', 'event')
  expect(data.tagLibrary).not.toContain('生日计划')
  expect(data.eventTagLibrary).not.toContain('手记专属')
  expect(addTag(data, 'Event', 'event')).toBe('Event')
  expect(addTag(data, 'event', 'event')).toBe('Event')
})
it('旧共用库按纪念日已用标签迁移，旧分类作为专属标签保留', () => {
  const data = emptyJournal()
  data.tagLibrary.push('仅手记', '旧纪念日')
  data.notes.push({ ...blankNote(), tags: ['仅手记'] })
  data.anniversaries.push({ id: 'old', title: '旧日子', date: '2020-01-01', category: '成长', repeat: 'yearly', reminderDays: 7, reminderTime: '09:00', pinned: false, description: '旧文字', images: ['data:image/jpeg;base64,AA=='], tags: ['旧纪念日'] })
  const { eventTagLibrary: _, ...legacy } = data
  const migrated = migrateJournal(legacy)!
  expect(migrated.eventTagLibrary).toContain('旧纪念日')
  expect(migrated.eventTagLibrary).not.toContain('仅手记')
  expect(migrated.tagLibrary).not.toContain('旧纪念日')
  expect(migrated.anniversaries[0].tags).toEqual(['成长', '旧纪念日'])
  expect(migrated.anniversaries[0].description).toBe('旧文字')
  expect(migrated.anniversaries[0].images).toEqual(['data:image/jpeg;base64,AA=='])
  expect(migrateJournal({ ...legacy, eventTagLibrary: [3] })).toBeNull()
  expect(migrateJournal(migrated)).toEqual(migrated)
})
