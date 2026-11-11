import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { fetchDashboardCharts, fetchDashboardStats } from '#/server/dashboard/dashboard.functions'

export const dashboardStatsQuery = queryOptions({
  queryKey: ['dashboard', 'stats'],
  queryFn: () => fetchDashboardStats(),
})

export const useDashboardStats = () => useSuspenseQuery(dashboardStatsQuery)

export const dashboardChartsQuery = queryOptions({
  queryKey: ['dashboard', 'charts'],
  queryFn: () => fetchDashboardCharts(),
})

export const useDashboardCharts = () => useSuspenseQuery(dashboardChartsQuery)
