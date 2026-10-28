export interface Person {
  id: string
  name: string
  avatar: string
  remark: string
  archived: boolean
  birthdayEventId: string
}
export interface BirthdayInput {
  date: string
  yearUnknown: boolean
  reuseEventId?: string
}
export interface Anniversary {
  tags?: string[]
  images?: string[]
  personIds?: string[]
  birthdayPersonId?: string
  yearUnknown?: boolean
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
  personIds?: string[]
  id: string
  title: string
  content: string
  date: string
  createdAt: string
  tags: string[]
  images: string[]
  place: string
  /** 仅保留旧版历史归属，新手记不再建立纪念日关联。 */
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
  tagLibrary: string[]
  people: Person[]
  anniversaries: Anniversary[]
  notes: Note[]
  draft: Note | null
  preferences: Preferences
}
export const categories = ['全部', '纪念', '生日', '成长', '其他']
export const defaultTags = ['日常', '旅行', '第一次', '成长', '纪念']
export function emptyJournal(): JournalData {
  return {
    tagLibrary: [...defaultTags],
    people: [],
    anniversaries: [],
    notes: [],
    draft: null,
    preferences: { time: '09:00', days: 7, sameDay: true },
  }
}
export function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T12:00:00`)
  return (
    !Number.isNaN(date.getTime())
    && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    === value
  )
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
  const inYear = (y: number) =>
    `${y}-${String(month).padStart(2, '0')}-${String(Math.min(day, new Date(y, month, 0).getDate())).padStart(2, '0')}`
  const candidate = inYear(year)
  return candidate < base ? inYear(year + 1) : candidate
}
export function countdown(event: Anniversary, base = today()) {
  return daysBetween(base, nextOccurrence(event, base))
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}
export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
export function blankNote(): Note {
  return {
    personIds: [],
    id: newId(),
    title: '',
    content: '',
    date: today(),
    createdAt: new Date().toISOString(),
    tags: [],
    images: [],
    place: '',
    anniversaryId: '',
    occurrence: '',
  }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function stringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every(item => typeof item === 'string')
  )
}
export function validAnniversary(value: unknown): value is Anniversary {
  return (
    record(value)
    && (value.tags === undefined || stringArray(value.tags))
    && (value.images === undefined || validImages(value.images))
    && (value.personIds === undefined || stringArray(value.personIds))
    && (value.birthdayPersonId === undefined
      || typeof value.birthdayPersonId === 'string')
    && (value.yearUnknown === undefined
      || typeof value.yearUnknown === 'boolean')
    && ['id', 'title', 'category', 'description', 'reminderTime'].every(
      key => typeof value[key] === 'string',
    )
    && validDate(value.date)
    && (value.repeat === 'yearly' || value.repeat === 'once')
    && typeof value.pinned === 'boolean'
    && [0, 1, 3, 7].includes(Number(value.reminderDays))
    && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value.reminderTime))
  )
}
export function validNote(value: unknown): value is Note {
  return (
    record(value)
    && !('weather' in value)
    && (value.personIds === undefined || stringArray(value.personIds))
    && [
      'id',
      'title',
      'content',
      'createdAt',
      'place',
      'anniversaryId',
      'occurrence',
    ].every(key => typeof value[key] === 'string')
    && validDate(value.date)
    && (value.occurrence === '' || validDate(value.occurrence))
    && stringArray(value.tags)
    && validImages(value.images)
  )
}
export function validJournal(value: unknown): value is JournalData {
  return (
    record(value)
    && stringArray(value.tagLibrary)
    && Array.isArray(value.people)
    && value.people.every(validPerson)
    && Array.isArray(value.anniversaries)
    && value.anniversaries.every(validAnniversary)
    && Array.isArray(value.notes)
    && value.notes.every(validNote)
    && (value.draft === null || validNote(value.draft))
    && record(value.preferences)
    && typeof value.preferences.sameDay === 'boolean'
    && [0, 1, 3, 7].includes(Number(value.preferences.days))
    && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value.preferences.time))
    && validPeopleLinks(value as unknown as JournalData)
  )
}

export function validPerson(value: unknown): value is Person {
  return (
    record(value)
    && ['id', 'name', 'avatar', 'remark', 'birthdayEventId'].every(
      key => typeof value[key] === 'string',
    )
    && (value.avatar === '' || (typeof value.avatar === 'string' && value.avatar.length <= 200000 && validImages([value.avatar])))
    && typeof value.archived === 'boolean'
    && String(value.id).length > 0
    && String(value.name).trim().length > 0
  )
}
/** 兼容旧手账与备份；补默认头像并移除关系、天气，保留生日和历史归属。 */
export function migrateJournal(value: unknown): JournalData | null {
  if (!record(value))
    return null
  const stripWeather = (note: unknown) => {
    if (!record(note))
      return note
    const result = { ...note }
    delete result.weather
    return result
  }
  const next = {
    ...value,
    tagLibrary:
      value.tagLibrary === undefined ? [...defaultTags] : value.tagLibrary,
    people: value.people === undefined
      ? []
      : Array.isArray(value.people)
        ? value.people.map((person) => {
            if (!record(person))
              return person
            const next = { ...person, avatar: person.avatar === undefined ? '' : person.avatar }
            delete (next as Record<string, unknown>).relationship
            return next
          })
        : value.people,
    notes: Array.isArray(value.notes)
      ? value.notes.map(stripWeather)
      : value.notes,
    draft: stripWeather(value.draft),
  }
  if (!validJournal(next))
    return null
  const result: JournalData = JSON.parse(JSON.stringify(next))
  for (const event of result.anniversaries) {
    event.tags ??= []
    event.images ??= []
  }
  result.tagLibrary = [
    ...new Set([
      ...result.tagLibrary,
      ...result.notes.flatMap(note => note.tags),
      ...(result.draft?.tags || []),
      ...result.anniversaries.flatMap(event => event.tags || []),
    ]),
  ]
  return result
}

function validImages(value: unknown): value is string[] {
  return (
    stringArray(value)
    && value.every(src => /^data:image\/(?:png|jpeg|webp);base64,/.test(src))
  )
}

function validPeopleLinks(data: JournalData) {
  const ids = new Set(data.people.map(person => person.id))
  if (ids.size !== data.people.length)
    return false
  const hasPeople = (personIds?: string[]) =>
    !personIds || personIds.every(id => ids.has(id))
  if (
    !data.anniversaries.every(event => hasPeople(event.personIds))
    || !data.notes.every(note => hasPeople(note.personIds))
    || (data.draft && !hasPeople(data.draft.personIds))
  ) {
    return false
  }
  for (const person of data.people) {
    if (!person.birthdayEventId)
      continue
    const birthday = data.anniversaries.find(
      event => event.id === person.birthdayEventId,
    )
    if (!birthday || birthday.birthdayPersonId !== person.id)
      return false
  }
  return data.anniversaries.every(
    event =>
      !event.birthdayPersonId
      || (event.repeat === 'yearly'
        && event.category === '生日'
        && event.personIds?.includes(event.birthdayPersonId)
        && data.people.some(
          person =>
            person.id === event.birthdayPersonId
            && person.birthdayEventId === event.id,
        )),
  )
}
