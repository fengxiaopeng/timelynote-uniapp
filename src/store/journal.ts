import type { Anniversary, JournalData, Note } from '@/domain/journal'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { countdown, emptyJournal, today } from '@/domain/journal'
import { cloneJournal, journalRepository } from '@/repositories/journal'
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
  async function update(change: (next: JournalData) => void) {
    const next = cloneJournal(data.value)
    change(next)
    await journalRepository.save(owner.value, next)
    data.value = next
  }
  async function saveEvent(event: Anniversary) {
    await update((next) => {
      if (event.pinned) {
        next.anniversaries.forEach((item) => {
          item.pinned = false
        })
      }
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
      const index = next.notes.findIndex(item => item.id === note.id)
      if (index < 0)
        next.notes.push(note)
      else next.notes[index] = note
      if (next.draft?.id === note.id)
        next.draft = null
    })
  }
  async function deleteEvent(id: string) {
    await update((next) => {
      next.anniversaries = next.anniversaries.filter(item => item.id !== id)
      for (const note of next.notes) {
        if (note.anniversaryId === id) {
          note.anniversaryId = ''
          note.occurrence = ''
        }
      }
      if (next.draft?.anniversaryId === id) {
        next.draft.anniversaryId = ''
        next.draft.occurrence = ''
      }
    })
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
      next.anniversaries.push(
        {
          id: 'sample-wedding',
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
          title: '第一次带小满看海',
          content:
            '她站在浅水里，浪一来就咯咯地笑，小手死死攥着我的食指不肯松开。阿宁在后面举着手机，说别看镜头，看她。\n\n原来幸福，就是把这些小小的瞬间记下来。',
          date: '2026-10-19',
          createdAt: `${today()}T09:00:00`,
          tags: ['小满', '旅行', '第一次'],
          images: [],
          place: '青岛石老人',
          weather: '晴 · 24°C',
          anniversaryId: 'sample-child',
          occurrence: '2027-01-20',
          sample: true,
        },
        {
          id: 'sample-orange',
          title: '他今晚说的一句话',
          content:
            '“我们老了以后，也这样坐着吧。”——说这话时他在剥橘子，头都没抬。我却记了一整晚。',
          date: '2026-10-15',
          createdAt: `${today()}T09:00:00`,
          tags: ['和阿宁', '日常'],
          images: [],
          place: '',
          weather: '',
          anniversaryId: '',
          occurrence: '',
          sample: true,
        },
        {
          id: 'sample-year',
          title: '第七年，还是同一家面馆',
          content: '老板记得我们，端上来时多加了两个荷包蛋，说“老规矩”。',
          date: '2025-11-14',
          createdAt: `${today()}T09:00:00`,
          tags: ['和阿宁'],
          images: [],
          place: '',
          weather: '',
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
    saveEvent,
    saveNote,
    deleteEvent,
    deleteNote,
    addSamples,
  }
})
