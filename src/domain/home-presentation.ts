import type { Anniversary } from './journal'
import { countdown, daysBetween, nextOccurrence } from './journal'

/** 未知出生年份只展示距下一次生日的天数，不使用内部占位年份。 */
export function featuredDay(event: Anniversary, base: string) {
  const elapsed = !event.yearUnknown && event.date <= base
  const days = elapsed ? daysBetween(event.date, base) : Math.max(0, countdown(event, base))
  return {
    days,
    prefix: elapsed ? '已经走过' : '还有',
    isToday: days === 0,
    period: event.yearUnknown
      ? `每年 ${Number(event.date.slice(5, 7))}月${Number(event.date.slice(8))}日`
      : `${event.date.replace(/-/g, '.')} — ${elapsed ? '今天' : '未来'}`,
  }
}
export function agendaSubtitle(event: Anniversary, base: string) {
  const date = nextOccurrence(event, base)
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(`${date}T12:00:00`).getDay()]
  const tags = (event.tags || []).slice(0, 2).join(' · ') || event.category
  return `${date.slice(0, 4) !== base.slice(0, 4) ? `${date.slice(0, 4)}年 · ` : ''}${weekday}${tags ? ` · ${tags}` : ''}`
}
