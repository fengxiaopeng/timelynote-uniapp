import { describe, expect, it } from 'vitest'
import { matchesRecordFacets, toggleFacet } from './record-filters'

describe('标签与人物组合查询', () => {
  const record = { tags: ['旅行', '第一次'], personIds: ['child', 'partner'] }
  it('空选择查询全部；同组任一匹配，两组同时匹配', () => {
    expect(matchesRecordFacets(record, [], [])).toBe(true)
    expect(matchesRecordFacets(record, ['日常', '旅行'], ['child'])).toBe(true)
    expect(matchesRecordFacets(record, ['旅行'], ['mom'])).toBe(false)
    expect(matchesRecordFacets(record, ['生日'], ['child'])).toBe(false)
    expect(matchesRecordFacets(record, [], ['mom', 'partner'])).toBe(true)
  })
  it('兼容没有人物或标签的旧记录，点击已选条件可取消', () => {
    expect(matchesRecordFacets({}, [], [])).toBe(true)
    expect(matchesRecordFacets({}, ['旅行'], [])).toBe(false)
    expect(toggleFacet(['旅行'], '日常')).toEqual(['旅行', '日常'])
    expect(toggleFacet(['旅行', '日常'], '旅行')).toEqual(['日常'])
  })
})
