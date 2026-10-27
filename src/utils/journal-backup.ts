import type { JournalData } from '@/domain/journal'
import { migrateJournal, today } from '@/domain/journal'

export function exportJournal(data: JournalData) {
  // #ifdef H5
  const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'timely-journal', version: 2, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `如期手记-${today()}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  // #endif
}
export function importJournal(onResult: (data: JournalData) => void, onError: (error: Error) => void) {
  // #ifdef H5
  const picker = document.createElement('input')
  picker.type = 'file'
  picker.accept = '.json,application/json'
  picker.onchange = async () => {
    try {
      const file = picker.files?.[0]
      if (!file)
        return
      if (file.size > 8 * 1024 * 1024)
        throw new Error('备份文件过大，请选择小于 8 MB 的备份')
      const backup = JSON.parse(await file.text())
      const migrated = migrateJournal(backup.data)
      if (backup.format !== 'timely-journal' || ![1, 2].includes(backup.version) || !migrated)
        throw new Error('这不是有效的如期手记备份')
      onResult(migrated)
    }
    catch (error) {
      onError(error as Error)
    }
  }
  picker.click()
  // #endif
}
