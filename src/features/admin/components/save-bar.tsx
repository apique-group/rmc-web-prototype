import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAdminAccess } from '@/features/admin/hooks/use-admin-access'
import { Button } from '@/components/ui/button'

/** Sticky-ish footer of a card: dirty hint + Batal + Simpan. */
export function SaveBar({ dirty, onSave, onReset, label = 'Simpan', disabled, children }: { dirty: boolean; onSave: () => void; onReset: () => void; label?: string; disabled?: boolean; children?: React.ReactNode }) {
  const { canEdit } = useAdminAccess()
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-4">
      <p className={cn('text-[12px]', dirty ? 'font-semibold text-warn' : 'text-ink-4')} aria-live="polite">{dirty ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan'}</p>
      <div className="flex items-center gap-2">
        {children}
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>Batal</Button>
        <Button type="button" size="sm" onClick={onSave} disabled={!dirty || disabled || !canEdit} title={canEdit ? undefined : 'Hanya lihat, tidak bisa menyimpan'}>{label}</Button>
      </div>
    </div>
  )
}
