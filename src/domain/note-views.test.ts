import { describe, expect, it } from 'vitest'
import { blankNote } from './journal'
import {
  albumDate,
  dayInMonth,
  monthCells,
  notesByDate,
  shiftMonth,
  sortNotes,
} from './note-views'

describe('手记的日历与日期分组', () => {
  it('星期一开始，十月一日在星期四，补齐末行空位', () => {
    const cells = monthCells('2026-10')
    expect(cells.slice(0, 4)).toEqual([null, null, null, '2026-10-01'])
    expect(cells).toHaveLength(35)
    expect(cells.filter(Boolean)).toHaveLength(31)
    expect(cells[30]).toBe('2026-10-28')
  })
  it('正确处理闰年、四行与六行的月份', () => {
    expect(monthCells('2024-02').filter(Boolean)).toHaveLength(29)
    expect(monthCells('2025-02').filter(Boolean)).toHaveLength(28)
    expect(monthCells('2021-02')).toHaveLength(28)
    expect(monthCells('2026-03')).toHaveLength(42)
  })
  it('跨年翻月，以及从月末切换到二月时收敛选中日期', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2027-01', -1)).toBe('2026-12')
    expect(dayInMonth('2024-01-31', '2024-02')).toBe('2024-02-29')
    expect(dayInMonth('2025-01-31', '2025-02')).toBe('2025-02-28')
  })
  it('按发生日期整理文字和照片手记，不用创建时间或图片数量移动记录', () => {
    const older = {
      ...blankNote(),
      id: 'older',
      date: '2025-01-01',
      createdAt: '2026-10-28T10:00:00Z',
      content: '补记',
    }
    const first = {
      ...blankNote(),
      id: 'first',
      date: '2026-10-28',
      createdAt: '2026-10-28T09:00:00Z',
    }
    const second = {
      ...blankNote(),
      id: 'second',
      date: '2026-10-28',
      createdAt: '2026-10-28T10:00:00Z',
      images: ['data:image/jpeg;base64,AA=='],
    }
    const input = [older, first, second]
    const groups = notesByDate(input)
    expect([...groups.keys()]).toEqual(['2026-10-28', '2025-01-01'])
    expect(groups.get('2026-10-28')?.map(note => note.id)).toEqual([
      'second',
      'first',
    ])
    expect(sortNotes(input).map(note => note.id)).toEqual([
      'second',
      'first',
      'older',
    ])
    expect(input[0].id).toBe('older')
  })
})

it('相册日期在跨年时显示年份，不混淆不同年份的同一天', () => {
  expect(albumDate('2026-10-28', '2026-10-28')).toBe('10月28日')
  expect(albumDate('2025-10-28', '2026-10-28')).toBe('2025年10月28日')
})
