import type { Anniversary } from './journal'
import { daysBetween, nextOccurrence, today } from './journal'

export function noteDayLabel(date: string, base = today()) {
  const distance = daysBetween(date, base)
  const day = `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`
  if (distance === 0)
    return `今天 · ${day}`
  if (distance === 1)
    return `昨天 · ${day}`
  return date.slice(0, 4) === base.slice(0, 4) ? day : `${date.slice(0, 4)}年${day}`
}
export function eventMonth(event: Anniversary, base = today()) {
  return nextOccurrence(event, base).slice(0, 7)
}
export function monthHeading(month: string) {
  return `${month.slice(0, 4)}年${Number(month.slice(5))}月`
}
export function compactDate(date: string) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${Number(date.slice(5, 7))}月${date.slice(8)}日 · ${weekdays[new Date(`${date}T12:00:00`).getDay()]}`
}
