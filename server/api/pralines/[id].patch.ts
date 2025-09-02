import { useValidatedParams, useValidatedBody, z, zh } from 'h3-zod'

export default eventHandler(async (event) => {
  const { id } = await useValidatedParams(event, {
    id: zh.intAsString
  })

  const { name, description, isVegan, imagePath } = await useValidatedBody(event, {
    name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name kann maximal 100 Zeichen haben').optional(),
    description: z.string().max(500, 'Beschreibung kann maximal 500 Zeichen haben').optional(),
    isVegan: z.boolean().optional(),
    imagePath: z.string().optional()
  })

  try {
    // Update-Objekt erstellen (nur gesetzte Felder)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (isVegan !== undefined) {
      updateData.isVegan = isVegan
    }

    if (imagePath !== undefined) {
      updateData.imagePath = imagePath
    }

    // Praline aktualisieren
    const updatedPraline = await useDB()
      .update(tables.pralines)
      .set(updateData)
      .where(eq(tables.pralines.id, id))
      .returning()
      .get()

    if (!updatedPraline) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Praline nicht gefunden'
      })
    }

    return updatedPraline
  }
  catch (error) {
    console.error('Fehler beim Aktualisieren der Praline:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Aktualisieren der Praline'
    })
  }
})
