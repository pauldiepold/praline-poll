import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const { name, description, isVegan, imagePath } = await useValidatedBody(event, {
    name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name kann maximal 100 Zeichen haben'),
    description: z.string().max(500, 'Beschreibung kann maximal 500 Zeichen haben').optional(),
    isVegan: z.boolean().default(false),
    imagePath: z.string().optional()
  })

  const year = parseInt(getRouterParam(event, 'year') || '')

  if (isNaN(year) || year <= 2020 || year > 2050) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
    })
  }

  const db = useDB()
  const now = new Date()

  try {
    // Neue Praline erstellen
    const newPraline = await db
      .insert(tables.pralines)
      .values({
        year,
        name: name.trim(),
        description: description?.trim() || null,
        isVegan: isVegan || false,
        imagePath: imagePath || '',
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get()

    return newPraline
  }
  catch (error) {
    console.error('Fehler beim Erstellen der Praline:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen der Praline'
    })
  }
})
