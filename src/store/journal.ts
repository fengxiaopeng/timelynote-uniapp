import type {
  Anniversary,
  BirthdayInput,
  JournalData,
  Note,
  Person,
} from '@/domain/journal'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { countdown, emptyJournal, today } from '@/domain/journal'
import { cloneJournal, journalRepository } from '@/repositories/journal'
import { addTag, normalizeTag } from '@/domain/tags'
import { removePerson, unlinkEvent, upsertPerson } from '@/domain/people'
import { useLocalSessionStore } from './local-session'

export const useJournalStore = defineStore('journal', () => {
  const data = ref<JournalData>(emptyJournal())
  const loading = ref(false)
  const owner = computed(
    () => useLocalSessionStore().session?.phone ?? 'guest',
  )
  const sortedEvents = computed(() =>
    [...data.value.anniversaries].sort((a, b) => countdown(a) - countdown(b)),
  )
  const sortedNotes = computed(() =>
    [...data.value.notes].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    ),
  )
  async function load() {
    loading.value = true
    try {
      data.value = await journalRepository.load(owner.value)
    }
    finally {
      loading.value = false
    }
  }
  let mutationQueue: Promise<void> = Promise.resolve()
  function update(change: (next: JournalData) => void) {
    const targetOwner = owner.value
    const task = mutationQueue.then(async () => {
      if (owner.value !== targetOwner)
        throw new Error('当前手账已切换，请重新操作')
      const next = cloneJournal(data.value)
      change(next)
      await journalRepository.save(targetOwner, next)
      if (owner.value === targetOwner)
        data.value = next
    })
    mutationQueue = task.catch(() => {})
    return task
  }
  async function saveTag(raw: string) {
    const normalized = normalizeTag(raw)
    const existing = data.value.tagLibrary.find(
      tag => tag.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
    )
    if (existing)
      return existing
    let saved = normalized
    await update((next) => {
      saved = addTag(next, normalized)
    })
    return saved
  }
  async function saveEvent(event: Anniversary) {
    await update((next) => {
      event = {
        ...event,
        yearUnknown: event.category === '生日' && !!event.yearUnknown,
      }
      if (event.yearUnknown)
        event.date = `2000-${event.date.slice(5)}`
      if (event.birthdayPersonId) {
        const person = next.people.find(
          item => item.id === event.birthdayPersonId,
        )
        if (!event.yearUnknown && event.date > today())
          throw new Error('出生日期不能晚于今天')
        if (!person || person.birthdayEventId !== event.id)
          throw new Error('生日关联已改变，请重新打开编辑')
        event = {
          ...event,
          category: '生日',
          repeat: 'yearly',
          personIds: [...new Set([...(event.personIds || []), person.id])],
        }
      }
      if (event.pinned) {
        next.anniversaries.forEach((item) => {
          item.pinned = false
        })
      }
      for (const tag of event.tags || []) addTag(next, tag)
      const index = next.anniversaries.findIndex(
        item => item.id === event.id,
      )
      if (index < 0)
        next.anniversaries.push(event)
      else next.anniversaries[index] = event
    })
  }
  async function saveNote(note: Note) {
    await update((next) => {
      for (const tag of note.tags) addTag(next, tag)
      const index = next.notes.findIndex(item => item.id === note.id)
      if (index < 0)
        next.notes.push(note)
      else next.notes[index] = note
      if (next.draft?.id === note.id)
        next.draft = null
    })
  }
  async function deleteEvent(id: string) {
    await update(next => unlinkEvent(next, id))
  }
  async function savePerson(
    person: Person,
    birthday: BirthdayInput | null,
    clear: 'keep' | 'delete' = 'keep',
  ) {
    await update(next => upsertPerson(next, person, birthday, clear))
  }
  async function deletePerson(id: string) {
    await update(next => removePerson(next, id))
  }

  async function deleteNote(id: string) {
    await update((next) => {
      next.notes = next.notes.filter(item => item.id !== id)
    })
  }
  async function addSamples() {
    await update((next) => {
      if (
        next.anniversaries.some(item => item.sample)
        || next.notes.some(item => item.sample)
      ) {
        return
      }
      const samplePeople = [
        {
          id: 'sample-person-ning',
          name: '阿宁',
          relationship: '伴侣',
          remark: '示例人物，可编辑或删除',
          archived: false,
          birthdayEventId: '',
        },
        {
          id: 'sample-person-mom',
          name: '妈妈',
          relationship: '父母',
          remark: '示例人物，可编辑或删除',
          archived: false,
          birthdayEventId: 'sample-birthday',
        },
        {
          id: 'sample-person-child',
          name: '小满',
          relationship: '孩子',
          remark: '示例人物，可编辑或删除',
          archived: false,
          birthdayEventId: '',
        },
      ]
      next.people.push(
        ...samplePeople.filter(
          person => !next.people.some(item => item.id === person.id),
        ),
      )
      next.anniversaries.push(
        {
          id: 'sample-wedding',
          personIds: ['sample-person-ning'],
          title: '结婚纪念日',
          date: '2018-11-14',
          category: '纪念',
          repeat: 'yearly',
          reminderDays: 7,
          reminderTime: '09:00',
          pinned: true,
          description: '往后的每一年，也一起慢慢走。',
          sample: true,
        },
        {
          id: 'sample-birthday',
          personIds: ['sample-person-mom'],
          birthdayPersonId: 'sample-person-mom',
          title: '妈妈生日',
          date: '1968-12-08',
          category: '生日',
          repeat: 'yearly',
          reminderDays: 7,
          reminderTime: '09:00',
          pinned: false,
          description: '',
          sample: true,
        },
        {
          id: 'sample-child',
          personIds: ['sample-person-child'],
          title: '小满周岁',
          date: '2027-01-20',
          category: '成长',
          repeat: 'once',
          reminderDays: 3,
          reminderTime: '09:00',
          pinned: false,
          description: '愿你自在长大。',
          sample: true,
        },
      )
      next.notes.push(
        {
          id: 'sample-sea',
          personIds: ['sample-person-child', 'sample-person-ning'],
          title: '第一次带小满看海',
          content:
            '她站在浅水里，浪一来就咯咯地笑，小手死死攥着我的食指不肯松开。阿宁在后面举着手机，说别看镜头，看她。\n\n原来幸福，就是把这些小小的瞬间记下来。',
          date: '2026-10-19',
          createdAt: `${today()}T09:00:00`,
          tags: ['小满', '旅行', '第一次'],
          images: [],
          place: '青岛石老人',
          anniversaryId: 'sample-child',
          occurrence: '2027-01-20',
          sample: true,
        },
        {
          id: 'sample-orange',
          personIds: ['sample-person-ning'],
          title: '他今晚说的一句话',
          content:
            '“我们老了以后，也这样坐着吧。”——说这话时他在剥橘子，头都没抬。我却记了一整晚。',
          date: '2026-10-15',
          createdAt: `${today()}T09:00:00`,
          tags: ['和阿宁', '日常'],
          images: [],
          place: '',
          anniversaryId: '',
          occurrence: '',
          sample: true,
        },
        {
          id: 'sample-year',
          personIds: ['sample-person-ning'],
          title: '第七年，还是同一家面馆',
          content: '老板记得我们，端上来时多加了两个荷包蛋，说“老规矩”。',
          date: '2025-11-14',
          createdAt: `${today()}T09:00:00`,
          tags: ['和阿宁'],
          images: [],
          place: '',
          anniversaryId: 'sample-wedding',
          occurrence: '2025-11-14',
          sample: true,
        },
      )
    })
  }
  return {
    data,
    loading,
    owner,
    sortedEvents,
    sortedNotes,
    load,
    update,
    saveTag,
    savePerson,
    deletePerson,
    saveEvent,
    saveNote,
    deleteEvent,
    deleteNote,
    addSamples,
  }
})
