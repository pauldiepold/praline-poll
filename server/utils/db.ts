import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export { sql, eq, and, or } from 'drizzle-orm'

export const tables = schema

export function useDB() {
  return drizzle(hubDatabase(), { schema })
}

// Export types for all models
export type Person = typeof tables.persons.$inferSelect
export type Praline = typeof tables.pralines.$inferSelect
export type PersonYear = typeof tables.personYears.$inferSelect
export type Rating = typeof tables.ratings.$inferSelect

// Insert types
export type NewPerson = typeof tables.persons.$inferInsert
export type NewPraline = typeof tables.pralines.$inferInsert
export type NewPersonYear = typeof tables.personYears.$inferInsert
export type NewRating = typeof tables.ratings.$inferInsert

export type Todo = typeof tables.todos.$inferSelect
