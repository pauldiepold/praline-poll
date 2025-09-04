export default eventHandler(async (event) => {
  const signature = getRouterParam(event, 'signature')

  if (!signature || signature.length !== 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültige Signatur'
    })
  }

  const db = useDB()

  try {
    // PersonYear mit Person laden
    const personYearResult = await db
      .select({
        personYear: tables.personYears,
        person: tables.persons
      })
      .from(tables.personYears)
      .innerJoin(tables.persons, eq(tables.personYears.personId, tables.persons.id))
      .where(eq(tables.personYears.signature, signature))
      .get()

    if (!personYearResult) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Signatur nicht gefunden'
      })
    }

    const { personYear, person } = personYearResult

    // Pralinen des Jahres laden
    const pralines = await db
      .select()
      .from(tables.pralines)
      .where(eq(tables.pralines.year, personYear.year))
      .orderBy(tables.pralines.name)
      .all()

    // Bestehende Bewertungen laden
    const ratings = await db
      .select()
      .from(tables.ratings)
      .where(eq(tables.ratings.personYearId, personYear.id))
      .all()

    // Bewertungen nach Praline gruppieren für einfacheren Zugriff
    const ratingsByPraline = ratings.reduce((acc, rating) => {
      acc[rating.pralineId] = rating
      return acc
    }, {} as Record<number, typeof ratings[0]>)

    return {
      personYear,
      person,
      pralines,
      ratings: ratingsByPraline,
      progress: {
        total: pralines.length,
        rated: ratings.length,
        percentage: pralines.length > 0 ? Math.round((ratings.length / pralines.length) * 100) : 0
      }
    }
  }
  catch (error: unknown) {
    console.error('Fehler beim Laden der Rating-Daten:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden der Daten'
    })
  }
})
