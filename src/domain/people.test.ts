import { describe, expect, it } from 'vitest'
import { blankNote, emptyJournal, migrateJournal, nextOccurrence, validJournal } from './journal'
import { birthdayOf, blankPerson, removePerson, unlinkEvent, upsertPerson } from './people'

describe('重要的人与生日', () => {
  it('可以不填写生日，也可以填写只有月日的闰日生日', () => {
    const data = emptyJournal()
    const person = { ...blankPerson(), name: '小满', relationship: '孩子' }
    upsertPerson(data, person, null)
    expect(data.anniversaries).toHaveLength(0)
    upsertPerson(data, data.people[0], { date: '2024-02-29', yearUnknown: true })
    const event = birthdayOf(data, data.people[0])!
    expect(event.date).toBe('2000-02-29')
    expect(event.yearUnknown).toBe(true)
    expect(nextOccurrence(event, '2026-02-01')).toBe('2026-02-28')
    expect(validJournal(data)).toBe(true)
  })
  it('复用已有生日，保留标题、提醒和历史手记；修改人物不会改手记日期和人物', () => {
    const data = emptyJournal()
    const person = { ...blankPerson(), name: '妈妈' }
    const event = { id: 'birthday', title: '妈妈生日', date: '1968-12-08', category: '生日', repeat: 'yearly' as const, reminderDays: 3, reminderTime: '08:00', pinned: true, description: '' }
    data.anniversaries.push(event)
    data.notes.push({ ...blankNote(), anniversaryId: event.id, occurrence: '2025-12-08', personIds: [person.id] })
    upsertPerson(data, person, { date: event.date, yearUnknown: false, reuseEventId: event.id })
    expect(data.anniversaries).toHaveLength(1)
    expect(birthdayOf(data, data.people[0])?.reminderTime).toBe('08:00')
    const before = JSON.stringify(data.notes)
    upsertPerson(data, { ...data.people[0], name: '母亲' }, { date: '1968-12-09', yearUnknown: false })
    expect(data.anniversaries[0].date).toBe('1968-12-09')
    expect(data.anniversaries[0].title).toBe('妈妈生日')
    expect(JSON.stringify(data.notes)).toBe(before)
    expect(validJournal(data)).toBe(true)
  })
  it('重命名自动生日标题，不创建重复生日；不能占用别人的生日', () => {
    const data = emptyJournal()
    upsertPerson(data, { ...blankPerson(), name: '小满' }, { date: '2026-01-20', yearUnknown: false })
    const id = data.anniversaries[0].id
    upsertPerson(data, { ...data.people[0], name: '宝宝' }, { date: '2026-01-21', yearUnknown: false })
    expect(data.anniversaries).toHaveLength(1)
    expect(data.anniversaries[0].title).toBe('宝宝的生日')
    expect(() => upsertPerson(data, { ...blankPerson(), name: '朋友' }, { date: '2000-01-01', yearUnknown: false, reuseEventId: id })).toThrow('属于其他人物')
  })
  it('清空生日可以保留纪念日；删除生日事件会同步清空人物生日并保留手记', () => {
    const data = emptyJournal()
    upsertPerson(data, { ...blankPerson(), name: '小满' }, { date: '2000-02-29', yearUnknown: true })
    const eventId = data.anniversaries[0].id
    data.notes.push({ ...blankNote(), anniversaryId: eventId, occurrence: '2026-02-28' })
    upsertPerson(data, data.people[0], null, 'keep')
    expect(data.people[0].birthdayEventId).toBe('')
    expect(data.anniversaries).toHaveLength(1)
    expect(data.anniversaries[0].birthdayPersonId).toBeUndefined()
    upsertPerson(data, data.people[0], { date: '2000-02-29', yearUnknown: true, reuseEventId: eventId })
    unlinkEvent(data, eventId)
    expect(data.people[0].birthdayEventId).toBe('')
    expect(data.notes).toHaveLength(1)
    expect(data.notes[0].anniversaryId).toBe('')
    expect(validJournal(data)).toBe(true)
  })
  it('归档保留关联，彻底删除人物解除全部关联但保留纪念日和手记', () => {
    const data = emptyJournal()
    upsertPerson(data, { ...blankPerson(), name: '朋友' }, { date: '2000-06-01', yearUnknown: true })
    const person = data.people[0]
    data.notes.push({ ...blankNote(), personIds: [person.id] })
    data.draft = { ...blankNote(), personIds: [person.id] }
    person.archived = true
    expect(validJournal(data)).toBe(true)
    removePerson(data, person.id)
    expect(data.anniversaries).toHaveLength(1)
    expect(data.notes).toHaveLength(1)
    expect(data.notes[0].personIds).toEqual([])
    expect(data.draft.personIds).toEqual([])
    expect(validJournal(data)).toBe(true)
  })
  it('拒绝未来生日、悬空人物和损坏的生日关系', () => {
    const data = emptyJournal()
    expect(() => upsertPerson(data, { ...blankPerson(), name: '朋友' }, { date: '2999-01-01', yearUnknown: false })).toThrow('不能晚于今天')
    data.notes.push({ ...blankNote(), personIds: ['missing'] })
    expect(validJournal(data)).toBe(false)
    const broken = emptyJournal()
    broken.people.push({ ...blankPerson(), name: '朋友', birthdayEventId: 'missing' })
    expect(validJournal(broken)).toBe(false)
  })
  it('旧备份只补人物字段，不猜测正文或标签中的人物', () => {
    const legacy = { anniversaries: [], notes: [{ ...blankNote(), content: '和妈妈吃饭', tags: ['妈妈'] }], draft: null, preferences: emptyJournal().preferences }
    const migrated = migrateJournal(legacy)!
    expect(migrated.people).toEqual([])
    expect(migrated.notes[0].content).toBe('和妈妈吃饭')
    expect(validJournal(migrated)).toBe(true)
    expect(migrateJournal({ ...legacy, people: 'broken' })).toBeNull()
  })
})
