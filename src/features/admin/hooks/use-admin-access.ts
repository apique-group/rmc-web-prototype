import * as React from 'react'
import { NO_ACTOR, type ActorContext } from '@/features/admin/lib/access'

/* Who is using the config surface and what they may do, provided once by AdminPage, read by SaveBar,
   RowTools, useDraft (audit "oleh …") and the few mutating controls that live in dialogs/portals. */
export const AdminAccessContext = React.createContext<ActorContext>(NO_ACTOR)

export const useAdminAccess = () => React.useContext(AdminAccessContext)
