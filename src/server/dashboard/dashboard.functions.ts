import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '#/server/auth/auth.service'
import { getDashboardCharts, getDashboardStats } from './dashboard.service'

export const fetchDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return getDashboardStats()
})

export const fetchDashboardCharts = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin()
  return getDashboardCharts()
})
