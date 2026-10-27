import type { Anniversary } from './journal'
import { describe, expect, it } from 'vitest'
import { blankNote, countdown, daysBetween, emptyJournal, nextOccurrence, validDate, validJournal } from './journal'

const event: Anniversary = { id: 'birthday', title: '生日', date: '2000-02-29', category: '生日', repeat: 'yearly', reminderDays: 7, reminderTime: '09:00', pinned: false, description: '' }

describe('纪念日的公历日期规则', () => {
  it('非闰年取二月底，闰年恢复原始日期', () => {
    expect(nextOccurrence(event, '2026-02-01')).toBe('2026-02-28')
    expect(nextOccurrence(event, '2027-03-01')).toBe('2028-02-29')
    expect(event.date).toBe('2000-02-29')
  })
  it('当天不滚到明年，过后再切换下一年', () => {
    expect(countdown(event, '2026-02-28')).toBe(0)
    expect(nextOccurrence(event, '2026-03-01')).toBe('2027-02-28')
  })
  it('一次性事件保留过去日期；未来原始日期不会提前发生', () => {
    expect(countdown({ ...event, repeat: 'once' }, '2000-03-01')).toBe(-1)
    expect(nextOccurrence({ ...event, date: '2030-11-14' }, '2026-10-27')).toBe('2030-11-14')
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })
  it('拒绝无效日期及损坏的备份数据', () => {
    expect(validDate('2026-02-29')).toBe(false)
    expect(validDate('2028-02-29')).toBe(true)
    expect(validJournal(emptyJournal())).toBe(true)
    expect(validJournal({ ...emptyJournal(), notes: [{ ...blankNote(), date: 'garbage' }] })).toBe(false)
    expect(validJournal({ ...emptyJournal(), notes: [{ ...blankNote(), images: ['javascript:alert(1)'] }] })).toBe(false)
  })
})
