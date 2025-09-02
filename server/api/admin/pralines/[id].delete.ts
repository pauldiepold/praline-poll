import { eq, count } from 'drizzle-orm'
import { useValidatedParams, zh } from 'h3-zod'

export default eventHandler(async (event) => {
  const { id } = await useValidatedParams(event, {
    id: zh.intAsString
  })

  // Authentifizierung für Admins erforderlich
  await requireUserSession(event)

  const db = useDB()

  try {
    // Prüfe, ob bereits Bewertungen für diese Praline existieren
    const ratingsCount = await db
      .select({ count: count() })
      .from(tables.ratings)
      .where(eq(tables.ratings.pralineId, id))
      .get()

    if (ratingsCount && ratingsCount.count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Praline kann nicht gelöscht werden, da bereits Bewertungen abgegeben wurden'
      })
    }

    // Prüfe, ob die Praline als Lieblingspraline markiert ist
    const favoriteCount = await db
      .select({ count: count() })
      .from(tables.personYears)
      .where(eq(tables.personYears.favoriteChocolateId, id))
      .get()

    if (favoriteCount && favoriteCount.count > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Praline kann nicht gelöscht werden, da sie als Lieblingspraline markiert ist'
      })
    }

    // Praline löschen
    const deletedPraline = await db
      .delete(tables.pralines)
      .where(eq(tables.pralines.id, id))
      .returning()
      .get()

    if (!deletedPraline) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Praline nicht gefunden'
      })
    }

    return {
      message: 'Praline erfolgreich gelöscht',
      deletedPraline
    }
  }
  catch (error) {
    console.error('Fehler beim Löschen der Praline:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen der Praline'
    })
  }
})
