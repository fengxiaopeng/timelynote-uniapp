import { describe, expect, it } from 'vitest'
import { compactDate, eventMonth, monthHeading, noteDayLabel } from './feed-presentation'
import type { Anniversary } from './journal'

const event: Anniversary = { id: 'event', title: '纪念', date: '2018-03-10', category: '纪念', repeat: 'yearly', reminderDays: 7, reminderTime: '09:00', pinned: false, description: '' }

describe('列表的时间分组', () => {
  it('按发生日期区分今天、跨年昨天和历史年份', () => {
    expect(noteDayLabel('2026-10-28', '2026-10-28')).toBe('今天 · 10月28日')
    expect(noteDayLabel('2025-12-31', '2026-01-01')).toBe('昨天 · 12月31日')
    expect(noteDayLabel('2025-10-28', '2026-10-28')).toBe('2025年10月28日')
    expect(noteDayLabel('2026-10-01', '2026-10-28')).toBe('10月1日')
  })
  it('纪念日按下次发生月份分组，保留一次性旧日子的实际月份', () => {
    expect(eventMonth(event, '2026-10-28')).toBe('2027-03')
    expect(eventMonth({ ...event, repeat: 'once' }, '2026-10-28')).toBe('2018-03')
    expect(monthHeading('2027-03')).toBe('2027年3月')
  })
  it('闰日纪念日以实际下次日期展示月份及星期', () => {
    expect(eventMonth({ ...event, date: '2024-02-29' }, '2025-01-01')).toBe('2025-02')
    expect(compactDate('2025-02-28')).toBe('2月28日 · 周五')
    expect(compactDate('2026-11-08')).toBe('11月08日 · 周日')
  })
})
