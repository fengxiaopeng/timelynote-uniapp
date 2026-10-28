import type { JournalData } from './journal'

export function normalizeTag(raw: string) {
  const tag = raw
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
  if (!tag)
    throw new Error('请写下标签名称')
  if (Array.from(tag).length > 20)
    throw new Error('标签名称请控制在 20 个字以内')
  return tag
}
export type TagScope = 'note' | 'event'
export function tagLibrary(data: JournalData, scope: TagScope = 'note') {
  return scope === 'event' ? data.eventTagLibrary : data.tagLibrary
}
export function addTag(data: JournalData, raw: string, scope: TagScope = 'note') {
  const tag = normalizeTag(raw)
  const library = tagLibrary(data, scope)
  const existing = library.find(
    item => item.toLocaleLowerCase() === tag.toLocaleLowerCase(),
  )
  if (!existing)
    library.push(tag)
  return existing || tag
}
