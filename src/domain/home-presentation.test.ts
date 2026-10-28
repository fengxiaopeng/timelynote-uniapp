import { describe, expect, it } from 'vitest'
import type { Anniversary } from './journal'
import { agendaSubtitle, featuredDay } from './home-presentation'

const event: Anniversary = { id: 'feature', title: '纪念', date: '2018-03-10', category: '纪念', repeat: 'yearly', reminderDays: 7, reminderTime: '09:00', pinned: true, description: '', tags: ['纪念'] }

describe('首页主卡与日程展示', () => {
  it('主卡计算真实走过的天数，未来日期不会显示负数', () => {
    expect(featuredDay(event, '2026-10-28')).toMatchObject({ days: 3154, prefix: '已经走过', isToday: false })
    expect(featuredDay({ ...event, date: '2027-03-10' }, '2026-10-28')).toMatchObject({ days: 133, prefix: '还有' })
    expect(featuredDay({ ...event, date: '2026-10-28' }, '2026-10-28').isToday).toBe(true)
  })
  it('旧月日生日保留未知年份语义，闰日按照原规则计算下次生日', () => {
    const metric = featuredDay({ ...event, date: '2000-02-29', category: '生日', yearUnknown: true }, '2025-02-27')
    expect(metric).toMatchObject({ days: 1, prefix: '还有', period: '每年 2月29日' })
    expect(metric.period).not.toContain('2000')
  })
  it('跨年日程明确年份，专属标签作为轻量信息展示', () => {
    expect(agendaSubtitle(event, '2026-10-28')).toBe('2027年 · 周三 · 纪念')
    expect(agendaSubtitle({ ...event, date: '1968-11-08', tags: ['生日', '家人'] }, '2026-10-28')).toBe('周日 · 生日 · 家人')
  })
})
