import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const signature = getRouterParam(event, 'signature')

  if (!signature || signature.length !== 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültige Signatur'
    })
  }

  const { pralineId, rating, comment } = await useValidatedBody(event, {
    pralineId: z.number().int().positive('Praline ID ist erforderlich'),
    rating: z.number().int().min(1, 'Bewertung muss mindestens 1 sein').max(5, 'Bewertung kann maximal 5 sein'),
    comment: z.string().max(500, 'Kommentar kann maximal 500 Zeichen haben').optional()
  })

  const db = useDB()
  const now = new Date()

  try {
    // PersonYear validieren
    const personYear = await db
      .select()
      .from(tables.personYears)
      .where(eq(tables.personYears.signature, signature))
      .get()

    if (!personYear) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Signatur nicht gefunden'
      })
    }

    // Praline validieren (muss zum gleichen Jahr gehören)
    const praline = await db
      .select()
      .from(tables.pralines)
      .where(and(
        eq(tables.pralines.id, pralineId),
        eq(tables.pralines.year, personYear.year)
      ))
      .get()

    if (!praline) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Praline nicht gefunden oder gehört nicht zum richtigen Jahr'
      })
    }

    // Prüfen ob Bewertung bereits existiert
    const existingRating = await db
      .select()
      .from(tables.ratings)
      .where(and(
        eq(tables.ratings.personYearId, personYear.id),
        eq(tables.ratings.pralineId, pralineId)
      ))
      .get()

    if (existingRating) {
      // Bewertung aktualisieren
      const updatedRating = await db
        .update(tables.ratings)
        .set({
          rating: rating as 1 | 2 | 3 | 4 | 5,
          comment: comment?.trim() || null,
          updatedAt: now
        })
        .where(eq(tables.ratings.id, existingRating.id))
        .returning()
        .get()

      return {
        success: true,
        rating: updatedRating,
        action: 'updated'
      }
    }
    else {
      // Neue Bewertung erstellen
      const newRating = await db
        .insert(tables.ratings)
        .values({
          personYearId: personYear.id,
          pralineId,
          rating: rating as 1 | 2 | 3 | 4 | 5,
          comment: comment?.trim() || null,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get()

      return {
        success: true,
        rating: newRating,
        action: 'created'
      }
    }
  }
  catch (error: unknown) {
    console.error('Fehler beim Speichern der Bewertung:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Speichern der Bewertung'
    })
  }
})
