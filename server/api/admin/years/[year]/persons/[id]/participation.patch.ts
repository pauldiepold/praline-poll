import { eq, and } from 'drizzle-orm'
import { useValidatedParams, useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const { year, id } = await useValidatedParams(event, {
    year: z.string().transform(val => parseInt(val)),
    id: z.string().transform(val => parseInt(val))
  })

  const { isParticipating } = await useValidatedBody(event, {
    isParticipating: z.boolean()
  })

  await requireUserSession(event)

  // Validierung: Jahr muss zwischen 2021 und 2050 liegen
  if (isNaN(year) || year <= 2020 || year > 2050) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
    })
  }

  // Prüfen ob Person existiert
  const person = await useDB().select().from(tables.persons).where(eq(tables.persons.id, id)).get()
  if (!person) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Person nicht gefunden'
    })
  }

  // Bestehende PersonYear für dieses Jahr suchen
  const existingPersonYear = await useDB()
    .select()
    .from(tables.personYears)
    .where(and(
      eq(tables.personYears.personId, id),
      eq(tables.personYears.year, year)
    ))
    .get()

  if (isParticipating) {
    // Teilnahme aktivieren
    if (existingPersonYear) {
      // Bestehende PersonYear aktualisieren
      const updatedPersonYear = await useDB()
        .update(tables.personYears)
        .set({
          isParticipating: true,
          updatedAt: new Date()
        })
        .where(eq(tables.personYears.id, existingPersonYear.id))
        .returning()
        .get()

      return updatedPersonYear
    }
    else {
      // Neue PersonYear erstellen (Signatur wird automatisch vom Schema generiert)
      const newPersonYear = await useDB()
        .insert(tables.personYears)
        .values({
          personId: id,
          year,
          isParticipating: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
        .get()

      return newPersonYear
    }
  }
  else {
    // Teilnahme deaktivieren
    if (existingPersonYear) {
      const updatedPersonYear = await useDB()
        .update(tables.personYears)
        .set({
          isParticipating: false,
          updatedAt: new Date()
        })
        .where(eq(tables.personYears.id, existingPersonYear.id))
        .returning()
        .get()

      return updatedPersonYear
    }
    else {
      // Keine PersonYear vorhanden, nichts zu tun
      return { message: 'Person nimmt bereits nicht teil' }
    }
  }
})
