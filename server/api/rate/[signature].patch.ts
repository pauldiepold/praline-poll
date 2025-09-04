import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const signature = getRouterParam(event, 'signature')

  if (!signature || signature.length !== 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültige Signatur'
    })
  }

  const { favoriteChocolateId, generalFeedback, allergies } = await useValidatedBody(event, {
    favoriteChocolateId: z.number().int().positive().optional(),
    generalFeedback: z.string().max(1000, 'Feedback kann maximal 1000 Zeichen haben').optional(),
    allergies: z.string().max(500, 'Allergien können maximal 500 Zeichen haben').optional()
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

    // Wenn favoriteChocolateId gesetzt ist, validieren dass die Praline existiert und zum richtigen Jahr gehört
    if (favoriteChocolateId) {
      const praline = await db
        .select()
        .from(tables.pralines)
        .where(and(
          eq(tables.pralines.id, favoriteChocolateId),
          eq(tables.pralines.year, personYear.year)
        ))
        .get()

      if (!praline) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Lieblingspraline nicht gefunden oder gehört nicht zum richtigen Jahr'
        })
      }
    }

    // PersonYear aktualisieren
    const updatedPersonYear = await db
      .update(tables.personYears)
      .set({
        favoriteChocolateId: favoriteChocolateId || null,
        generalFeedback: generalFeedback?.trim() || null,
        allergies: allergies?.trim() || null,
        updatedAt: now
      })
      .where(eq(tables.personYears.id, personYear.id))
      .returning()
      .get()

    return {
      success: true,
      personYear: updatedPersonYear
    }
  }
  catch (error: unknown) {
    console.error('Fehler beim Aktualisieren der PersonYear-Daten:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Speichern der Daten'
    })
  }
})
