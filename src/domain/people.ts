import type {
  Anniversary,
  BirthdayInput,
  JournalData,
  Person,
} from './journal'
import { newId, today, validDate } from './journal'

export function blankPerson(): Person {
  return {
    id: newId(),
    name: '',
    avatar: '',
    remark: '',
    archived: false,
    birthdayEventId: '',
  }
}
export function birthdayOf(data: JournalData, person: Person) {
  return data.anniversaries.find(
    event => event.id === person.birthdayEventId,
  )
}
export function birthdayLabel(event?: Anniversary) {
  if (!event)
    return '未设置生日'
  return `${event.yearUnknown ? '' : `${event.date.slice(0, 4)}年`}${Number(event.date.slice(5, 7))}月${Number(event.date.slice(8))}日`
}
export function peopleText(data: JournalData, ids: string[] = []) {
  return data.people
    .filter(person => ids.includes(person.id))
    .map(person => person.name)
    .join(' ')
}
export function unlinkEvent(data: JournalData, id: string) {
  data.anniversaries = data.anniversaries.filter(event => event.id !== id)
  for (const person of data.people) {
    if (person.birthdayEventId === id)
      person.birthdayEventId = ''
  }
  for (const note of [...data.notes, ...(data.draft ? [data.draft] : [])]) {
    if (note.anniversaryId === id) {
      note.anniversaryId = ''
      note.occurrence = ''
    }
  }
}
/** 人物生日唯一事实源是关联纪念日，双向入口编辑的都是同一条事件。 */
export function upsertPerson(
  data: JournalData,
  person: Person,
  birthday: BirthdayInput | null,
  clear: 'keep' | 'delete' = 'keep',
) {
  if (!person.name.trim())
    throw new Error('请填写人物称呼')
  const existing = data.people.find(item => item.id === person.id)
  const previousEvent = existing ? birthdayOf(data, existing) : undefined
  const saved = {
    ...person,
    name: person.name.trim(),
    birthdayEventId: previousEvent?.id || '',
  }
  if (birthday) {
    const date = birthday.yearUnknown
      ? `2000-${birthday.date.slice(5)}`
      : birthday.date
    if (!validDate(date) || (!birthday.yearUnknown && date > today()))
      throw new Error('请选择有效生日，出生日期不能晚于今天')
    const reused = birthday.reuseEventId
      ? data.anniversaries.find(event => event.id === birthday.reuseEventId)
      : undefined
    if (birthday.reuseEventId && !reused)
      throw new Error('选中的生日纪念日已不存在')
    if (reused?.birthdayPersonId && reused.birthdayPersonId !== saved.id)
      throw new Error('这个生日已属于其他人物')
    const event
      = reused
        || previousEvent
        || ({
          id: newId(),
          title: `${saved.name}的生日`,
          date,
          category: '生日',
          repeat: 'yearly',
          reminderDays: data.preferences.days,
          reminderTime: data.preferences.time,
          pinned: false,
          description: '',
        } as Anniversary)
    if (previousEvent && previousEvent.id !== event.id)
      delete previousEvent.birthdayPersonId
    // 自动命名的生日随人物更名，用户自己改过的标题保留。
    if (existing && event.title === `${existing.name}的生日`)
      event.title = `${saved.name}的生日`
    Object.assign(event, {
      date,
      yearUnknown: birthday.yearUnknown,
      repeat: 'yearly',
      category: '生日',
      tags: [...new Set([...(event.tags || []), '生日'])],
      birthdayPersonId: saved.id,
      personIds: [...new Set([...(event.personIds || []), saved.id])],
    })
    if (!data.anniversaries.some(item => item.id === event.id))
      data.anniversaries.push(event)
    saved.birthdayEventId = event.id
  }
  else if (previousEvent) {
    if (clear === 'delete')
      unlinkEvent(data, previousEvent.id)
    else delete previousEvent.birthdayPersonId
    saved.birthdayEventId = ''
  }
  const index = data.people.findIndex(item => item.id === saved.id)
  if (index < 0)
    data.people.push(saved)
  else data.people[index] = saved
}
export function removePerson(data: JournalData, id: string) {
  data.people = data.people.filter(person => person.id !== id)
  for (const event of data.anniversaries) {
    event.personIds = (event.personIds || []).filter(
      personId => personId !== id,
    )
    if (event.birthdayPersonId === id)
      delete event.birthdayPersonId
  }
  for (const note of [...data.notes, ...(data.draft ? [data.draft] : [])]) {
    note.personIds = (note.personIds || []).filter(
      personId => personId !== id,
    )
  }
}
