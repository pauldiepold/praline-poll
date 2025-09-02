import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const year = parseInt(getRouterParam(event, 'year') || '')

  // Validierung: Jahr muss zwischen 2021 und 2050 liegen
  if (isNaN(year) || year <= 2020 || year > 2050) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
    })
  }

  // Alle Personen mit angereicherten PersonYear-Daten laden
  const enrichedPersons = await useDB()
    .select({
      // Person-Daten
      id: tables.persons.id,
      firstName: tables.persons.firstName,
      lastName: tables.persons.lastName,
      createdAt: tables.persons.createdAt,
      updatedAt: tables.persons.updatedAt,
      // PersonYear-Daten (können null sein)
      personYearId: tables.personYears.id,
      signature: tables.personYears.signature,
      isParticipating: tables.personYears.isParticipating,
      favoriteChocolateId: tables.personYears.favoriteChocolateId,
      generalFeedback: tables.personYears.generalFeedback,
      allergies: tables.personYears.allergies,
      personYearCreatedAt: tables.personYears.createdAt,
      personYearUpdatedAt: tables.personYears.updatedAt
    })
    .from(tables.persons)
    .leftJoin(
      tables.personYears,
      and(
        eq(tables.persons.id, tables.personYears.personId),
        eq(tables.personYears.year, year)
      )
    )
    .all()

  // Daten in die gewünschte Struktur umwandeln
  const result = enrichedPersons.map(row => ({
    // Person-Daten
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // PersonYear-Daten (nur wenn vorhanden)
    personYear: row.personYearId
      ? {
          id: row.personYearId,
          signature: row.signature,
          isParticipating: row.isParticipating,
          favoriteChocolateId: row.favoriteChocolateId,
          generalFeedback: row.generalFeedback,
          allergies: row.allergies,
          createdAt: row.personYearCreatedAt,
          updatedAt: row.personYearUpdatedAt
        }
      : null,
    // Hilfsfeld
    hasPersonYear: !!row.personYearId
  }))

  return result
})
