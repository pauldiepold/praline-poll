import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const { firstName, lastName } = await useValidatedBody(event, {
    firstName: z.string().min(1, 'Vorname ist erforderlich').max(100, 'Vorname kann maximal 100 Zeichen haben'),
    lastName: z.string().min(1, 'Nachname ist erforderlich').max(100, 'Nachname kann maximal 100 Zeichen haben')
  })

  const year = parseInt(getRouterParam(event, 'year') || '')

  // Validierung: Jahr muss zwischen 2021 und 2050 liegen
  if (isNaN(year) || year <= 2020 || year > 2050) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
    })
  }

  const db = useDB()
  const now = new Date()

  try {
    // 1. Neue Person erstellen
    const person = await db.insert(tables.persons).values({
      firstName,
      lastName,
      createdAt: now,
      updatedAt: now
    }).returning().get()

    // 2. PersonYear-Eintrag erstellen (Signatur wird automatisch vom Schema generiert)
    const personYear = await db.insert(tables.personYears).values({
      personId: person.id,
      year,
      isParticipating: true,
      createdAt: now,
      updatedAt: now
    }).returning().get()

    // 3. Angereicherte Daten zurückgeben
    return {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      personYear: {
        id: personYear.id,
        signature: personYear.signature,
        isParticipating: personYear.isParticipating,
        favoriteChocolateId: personYear.favoriteChocolateId,
        generalFeedback: personYear.generalFeedback,
        allergies: personYear.allergies,
        createdAt: personYear.createdAt,
        updatedAt: personYear.updatedAt
      },
      hasPersonYear: true
    }
  }
  catch (error) {
    console.error('Fehler beim Erstellen der Person:', error)

    // Spezifische Fehlerbehandlung
    if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Eine Person mit diesem Namen existiert bereits für dieses Jahr'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen der Person'
    })
  }
})
