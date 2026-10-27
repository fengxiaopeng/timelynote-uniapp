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
    expect(migrateJournal(data)?.tagLibrary).toContain('仪式感')
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
