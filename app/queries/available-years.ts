import { defineQueryOptions } from '@pinia/colada'

export const availableYearsQuery = defineQueryOptions({
  key: ['available-years'],
  query: () => $fetch('/api/years/available') as Promise<{
    years: number[]
    currentYear: number
    nextYear: number
  }>
})
