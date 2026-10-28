import type { Note } from './journal'

export type NoteView = 'default' | 'album' | 'calendar'
export const noteViews: { id: NoteView, label: string, icon: string }[] = [
  { id: 'default', label: '默认', icon: 'clock' },
  { id: 'album', label: '相册', icon: 'image' },
  { id: 'calendar', label: '日历', icon: 'cal' },
]
export function sortNotes(notes: Note[]) {
  return [...notes].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  )
}
export function notesByDate(notes: Note[]) {
  const groups = new Map<string, Note[]>()
  for (const note of sortNotes(notes)) {
    const group = groups.get(note.date) || []
    group.push(note)
    groups.set(note.date, group)
  }
  return groups
}
export function monthCells(month: string): (string | null)[] {
  const [year, index] = month.split('-').map(Number)
  const offset = (new Date(year, index - 1, 1).getDay() + 6) % 7
  const days = new Date(year, index, 0).getDate()
  const size = Math.ceil((offset + days) / 7) * 7
  return Array.from({ length: size }, (_, position) =>
    position < offset || position >= offset + days
      ? null
      : `${month}-${String(position - offset + 1).padStart(2, '0')}`)
}
export function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split('-').map(Number)
  const next = new Date(year, index - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}
export function dayInMonth(date: string, month: string) {
  const [year, index] = month.split('-').map(Number)
  const day = Math.min(
    Number(date.slice(8)),
    new Date(year, index, 0).getDate(),
  )
  return `${month}-${String(day).padStart(2, '0')}`
}
export function shortDate(date: string) {
  return `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`
}

/** 相册没有年月分组，跨年记录需在日期文字中补全年份。 */
export function albumDate(date: string, base: string) {
  return `${date.slice(0, 4) === base.slice(0, 4) ? '' : `${date.slice(0, 4)}年`}${shortDate(date)}`
}
