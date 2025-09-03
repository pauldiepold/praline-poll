import { defineQuery, useQuery } from '@pinia/colada'

export const useAvailableYears = defineQuery(() => {
  const { state, ...rest } = useQuery({
    key: ['available-years'],
    query: () => $fetch('/api/admin/years/available') as Promise<number[]>
  })
  
  return {
    ...rest,
    availableYears: state
  }
})
