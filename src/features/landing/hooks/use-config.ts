'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { landingApi } from '../api/landing.api'

export const configKey = ['member', 'config'] as const

/** The site config, read on almost every page (header, footer, landing, checkout, profile). */
export const useAppConfig = () => useSuspenseQuery({ queryKey: configKey, queryFn: landingApi.getConfig }).data
