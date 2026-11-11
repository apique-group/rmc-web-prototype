import '@tanstack/react-query'

/* Same as apique-web-rmc/src/types/react-query.d.ts: the extra fields a query or mutation may carry for the
   shared error / success toasts. */
export type MetaMessage =
  | string
  | {
      title: string
      description?: string
    }

export type QueryMeta = {
  errorMessage?: MetaMessage
  showErrorToast?: boolean
}

export type MutationMeta = {
  successMessage?: MetaMessage
  errorMessage?: MetaMessage
  showErrorToast?: boolean
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryMeta
    mutationMeta: MutationMeta
  }
}
