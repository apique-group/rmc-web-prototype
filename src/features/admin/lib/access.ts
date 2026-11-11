/* Actor context for the config surface (R.014).
   The passcode gate is gone: the CRM (Member Card (RMC) → Golden Privilege) embeds `/admin?embed=1&…` and
   passes WHO is looking and what the Role Access Matrix + capabilities say, the same two axes production UM
   uses (module level Full/Edit/View/None per role, capability keys per role). Prototype trust: the URL is the
   contract; production reads both from the UM `/me/permissions` response instead. */

export type AccessLevel = 'Full' | 'Edit' | 'View' | 'None'

export interface ActorContext {
  embed: boolean
  actor: string
  role: string
  level: AccessLevel
  caps: string[]
  /** allowed to see the config at all (embedded, identified, level ≠ None) */
  allowed: boolean
  /** level Full/Edit AND capability `manage_config` (or `super_admin`) */
  canEdit: boolean
  /** allowed but not canEdit → everything mutating is disabled */
  readOnly: boolean
  /** why canEdit is false, for the banner */
  reason: string
}

export const EDIT_CAPABILITY = 'manage_config'

const LEVELS: AccessLevel[] = ['Full', 'Edit', 'View', 'None']

export function parseActor(params: URLSearchParams): ActorContext {
  const embed = params.get('embed') === '1'
  const actor = (params.get('actor') || '').trim()
  const role = (params.get('role') || '').trim()
  const lvlRaw = (params.get('level') || '').trim()
  const level: AccessLevel = (LEVELS as string[]).includes(lvlRaw) ? (lvlRaw as AccessLevel) : 'None'
  const caps = (params.get('caps') || '').split(',').map(s => s.trim()).filter(Boolean)
  const allowed = embed && !!actor && level !== 'None'
  const hasCap = caps.includes('super_admin') || caps.includes(EDIT_CAPABILITY)
  const levelOk = level === 'Full' || level === 'Edit'
  const canEdit = allowed && levelOk && hasCap
  let reason = ''
  if (allowed && !canEdit) {
    if (!levelOk && !hasCap) reason = `level akses View dan tanpa capability ${EDIT_CAPABILITY}`
    else if (!levelOk) reason = 'level akses View di Role Access Matrix'
    else reason = `tanpa capability ${EDIT_CAPABILITY} di User Management`
  }
  return { embed, actor, role, level, caps, allowed, canEdit, readOnly: allowed && !canEdit, reason }
}

export const NO_ACTOR: ActorContext = { embed: false, actor: '', role: '', level: 'None', caps: [], allowed: false, canEdit: false, readOnly: false, reason: '' }
