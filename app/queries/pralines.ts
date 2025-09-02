import { defineQueryOptions } from '@pinia/colada'

export const pralinesQuery = defineQueryOptions((year: number) => ({
  key: ['pralines', year],
  query: () => $fetch(`/api/admin/years/${year}/pralines`) as Promise<Praline[]>
}))

// Type für Pralinen
export type Praline = {
  id: number
  year: number
  name: string
  description: string | null
  isVegan: boolean
  imagePath: string
  createdAt: Date
  updatedAt: Date
}
