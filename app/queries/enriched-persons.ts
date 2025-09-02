import { defineQueryOptions } from '@pinia/colada'

export const enrichedPersonsQuery = defineQueryOptions((year: number) => ({
  key: ['enriched-persons', year],
  query: () => $fetch(`/api/admin/years/${year}/persons`) as Promise<EnrichedPerson[]>
}))

// Type für angereicherte Person mit PersonYear-Daten
export type EnrichedPerson = {
  // Person-Daten
  id: number
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
  // PersonYear-Daten (nur wenn vorhanden)
  personYear: {
    id: number
    signature: string
    isParticipating: boolean
    favoriteChocolateId: number | null
    generalFeedback: string | null
    allergies: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  // Hilfsfeld
  hasPersonYear: boolean
}
