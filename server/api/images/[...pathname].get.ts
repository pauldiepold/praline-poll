export default eventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')

  if (!pathname) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pfad ist erforderlich'
    })
  }

  try {
    // Weiterleitung an den gleichen Endpunkt wie im Admin, aber öffentlich
    return sendRedirect(event, `/api/admin/images/${pathname}`)
  }
  catch (error) {
    console.error('Fehler beim Laden des Bildes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Laden des Bildes'
    })
  }
})
