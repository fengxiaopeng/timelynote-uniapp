export interface RecordFacets {
  tags?: string[]
  personIds?: string[]
}
/** 组内任一匹配；标签组与人物组之间同时匹配。空选择表示不限制。 */
export function matchesRecordFacets(
  record: RecordFacets,
  selectedTags: string[],
  selectedPeople: string[],
) {
  return (
    (!selectedTags.length
      || selectedTags.some(tag => record.tags?.includes(tag)))
    && (!selectedPeople.length
      || selectedPeople.some(id => record.personIds?.includes(id)))
  )
}
export function toggleFacet(values: string[], value: string) {
  return values.includes(value)
    ? values.filter(item => item !== value)
    : [...values, value]
}
