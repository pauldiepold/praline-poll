import { sql } from 'drizzle-orm'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDB()

  try {
    // Alle Jahre aus PersonYears und Pralines holen
    const result = await db.select({
      year: sql<number>`DISTINCT year`
    })
      .from(tables.personYears)
      .union(
        db.select({
          year: sql<number>`DISTINCT year`
        })
          .from(tables.pralines)
      )
      .orderBy(sql`year ASC`)

    // Jahre extrahieren und sortieren
    const years = [...new Set(result.map(row => row.year))].sort((a, b) => a - b)

    // Folgejahr zum letzten Jahr hinzufügen (falls es noch nicht existiert)
    if (years.length > 0) {
      const lastYear = Math.max(...years)
      const nextYear = lastYear + 1

      if (!years.includes(nextYear)) {
        years.push(nextYear)
      }
    }
    else {
      // Falls keine Jahre in der DB existieren, aktuelles Jahr + 1 hinzufügen
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      years.push(nextYear)
    }

    return years as number[]
  }
  catch (error) {
    console.error('Fehler beim Abrufen der verfügbaren Jahre:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Abrufen der verfügbaren Jahre'
    })
  }
})
