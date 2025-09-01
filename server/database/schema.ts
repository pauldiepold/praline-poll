import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Person
export const persons = sqliteTable('persons', {
  id: integer('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// Praline (direkt mit Jahr verknüpft)
export const pralines = sqliteTable('pralines', {
  id: integer('id').primaryKey(),
  year: integer('year').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isVegan: integer('is_vegan', { mode: 'boolean' }).notNull().default(false),
  imagePath: text('image_path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// PersonYear (Through-Model)
export const personYears = sqliteTable('person_years', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  year: integer('year').notNull(),
  signature: text('signature').notNull(),
  isParticipating: integer('is_participating', { mode: 'boolean' }).notNull().default(false),
  favoriteChocolateId: integer('favorite_chocolate_id').references(() => pralines.id),
  generalFeedback: text('general_feedback'),
  allergies: text('allergies'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, table => ({
  personYearUnique: unique('person_year_unique').on(table.personId, table.year),
  signatureYearUnique: unique('signature_year_unique').on(table.signature, table.year)
}))

// Rating
export const ratings = sqliteTable('ratings', {
  id: integer('id').primaryKey(),
  personYearId: integer('person_year_id').notNull().references(() => personYears.id),
  pralineId: integer('praline_id').notNull().references(() => pralines.id),
  rating: integer('rating').notNull().$type<1 | 2 | 3 | 4 | 5>(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, table => ({
  personYearPralineUnique: unique('person_year_praline_unique').on(table.personYearId, table.pralineId)
}))

// Relations
export const personsRelations = relations(persons, ({ many }) => ({
  personYears: many(personYears)
}))

export const pralinesRelations = relations(pralines, ({ many }) => ({
  ratings: many(ratings)
}))

export const personYearsRelations = relations(personYears, ({ one, many }) => ({
  person: one(persons, {
    fields: [personYears.personId],
    references: [persons.id]
  }),
  favoriteChocolate: one(pralines, {
    fields: [personYears.favoriteChocolateId],
    references: [pralines.id]
  }),
  ratings: many(ratings)
}))

export const ratingsRelations = relations(ratings, ({ one }) => ({
  personYear: one(personYears, {
    fields: [ratings.personYearId],
    references: [personYears.id]
  }),
  praline: one(pralines, {
    fields: [ratings.pralineId],
    references: [pralines.id]
  })
}))
