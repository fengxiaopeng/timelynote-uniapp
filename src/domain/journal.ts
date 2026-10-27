export interface Anniversary {
  id: string
  title: string
  date: string
  category: string
  repeat: 'yearly' | 'once'
  reminderDays: number
  reminderTime: string
  pinned: boolean
  description: string
  sample?: boolean
}
export interface Note {
  id: string
  title: string
  content: string
  date: string
  createdAt: string
  tags: string[]
  images: string[]
  place: string
  weather: string
  anniversaryId: string
  occurrence: string
  sample?: boolean
}
export interface Preferences {
  time: string
  days: number
  sameDay: boolean
}
export interface JournalData {
  anniversaries: Anniversary[]
  notes: Note[]
  draft: Note | null
  preferences: Preferences
}
export const categories = ['全部', '纪念', '生日', '成长', '其他']
export const noteTags = ['日常', '和阿宁', '小满', '旅行', '第一次']
export function emptyJournal(): JournalData {
  return { anniversaries: [], notes: [], draft: null, preferences: { time: '09:00', days: 7, sameDay: true } }
}
export function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value
}
function dayNumber(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}
export function daysBetween(from: string, to: string) {
  return dayNumber(to) - dayNumber(from)
}
/** 公历年度重复；2 月 29 日在非闰年取当月末日。原始日期始终保留。 */
export function nextOccurrence(event: Anniversary, base = today()) {
  if (event.repeat === 'once' || event.date >= base)
    return event.date
  const year = Number(base.slice(0, 4))
  const month = Number(event.date.slice(5, 7))
  const day = Number(event.date.slice(8, 10))
  const inYear = (y: number) => `${y}-${String(month).padStart(2, '0')}-${String(Math.min(day, new Date(y, month, 0).getDate())).padStart(2, '0')}`
  const candidate = inYear(year)
  return candidate < base ? inYear(year + 1) : candidate
}
export function countdown(event: Anniversary, base = today()) {
  return daysBetween(base, nextOccurrence(event, base))
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}
export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
export function blankNote(): Note {
  return { id: newId(), title: '', content: '', date: today(), createdAt: new Date().toISOString(), tags: [], images: [], place: '', weather: '', anniversaryId: '', occurrence: '' }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}
export function validAnniversary(value: unknown): value is Anniversary {
  return record(value) && ['id', 'title', 'category', 'description', 'reminderTime'].every(key => typeof value[key] === 'string')
    && validDate(value.date) && (value.repeat === 'yearly' || value.repeat === 'once')
    && typeof value.pinned === 'boolean' && [0, 1, 3, 7].includes(Number(value.reminderDays))
    && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value.reminderTime))
}
export function validNote(value: unknown): value is Note {
  return record(value) && ['id', 'title', 'content', 'createdAt', 'place', 'weather', 'anniversaryId', 'occurrence'].every(key => typeof value[key] === 'string')
    && validDate(value.date) && (value.occurrence === '' || validDate(value.occurrence)) && stringArray(value.tags) && stringArray(value.images)
    && value.images.every(src => /^data:image\/(?:png|jpeg|webp);base64,/.test(src))
}
export function validJournal(value: unknown): value is JournalData {
  return record(value) && Array.isArray(value.anniversaries) && value.anniversaries.every(validAnniversary)
    && Array.isArray(value.notes) && value.notes.every(validNote) && (value.draft === null || validNote(value.draft))
    && record(value.preferences) && typeof value.preferences.sameDay === 'boolean'
    && [0, 1, 3, 7].includes(Number(value.preferences.days)) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value.preferences.time))
}
