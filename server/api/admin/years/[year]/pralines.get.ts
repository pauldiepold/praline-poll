export default eventHandler(async (event) => {
  await requireUserSession(event)

  const year = parseInt(getRouterParam(event, 'year') || '')

  if (isNaN(year) || year <= 2020 || year > 2050) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiges Jahr. Das Jahr muss zwischen 2021 und 2050 liegen.'
    })
  }

  try {
    const yearPralines = await useDB()
      .select()
      .from(tables.pralines)
      .where(eq(tables.pralines.year, year))
      .orderBy(tables.pralines.name)
      .all()

    return yearPralines
  }
  catch (error) {
    console.error('Fehler beim Abrufen der Pralinen:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der Pralinen'
    })
  }
})
