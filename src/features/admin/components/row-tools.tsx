import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useAdminAccess } from '@/features/admin/hooks/use-admin-access'
import { Button } from '@/components/ui/button'

/** Up / down / remove trio for list editors. */
export function RowTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const { canEdit } = useAdminAccess()
  return (
    <div className="flex items-center gap-0.5">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Naik" disabled={!canEdit || index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp strokeWidth={1.6} /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Turun" disabled={!canEdit || index === count - 1} onClick={() => onMove(index, index + 1)}><ArrowDown strokeWidth={1.6} /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Hapus" disabled={!canEdit} className="text-danger hover:bg-danger-50 hover:text-danger" onClick={onRemove}><Trash2 strokeWidth={1.6} /></Button>
    </div>
  )
}
