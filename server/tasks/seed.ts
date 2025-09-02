export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task for Pralinen-Bewertungs-App'
  },
  async run() {
    console.log('Running DB seed task...')

    const db = useDB()

    // Alle Tabellen leeren (in umgekehrter Reihenfolge wegen Foreign Keys)
    console.log('🧹 Leere alle Tabellen...')
    await db.delete(tables.ratings)
    await db.delete(tables.personYears)
    await db.delete(tables.pralines)
    await db.delete(tables.persons)
    console.log('✅ Alle Tabellen geleert')

    const now = new Date()

    // 1. Jahre definieren
    const years = [2024, 2025]
    console.log('📅 Jahre:', years)

    // 2. Personen erstellen
    const germanNames = [
      { firstName: 'Anna', lastName: 'Müller' },
      { firstName: 'Max', lastName: 'Schmidt' },
      { firstName: 'Lisa', lastName: 'Weber' },
      { firstName: 'Tom', lastName: 'Fischer' },
      { firstName: 'Sarah', lastName: 'Wagner' },
      { firstName: 'Felix', lastName: 'Becker' },
      { firstName: 'Emma', lastName: 'Schulz' },
      { firstName: 'Lukas', lastName: 'Hoffmann' },
      { firstName: 'Mia', lastName: 'Koch' },
      { firstName: 'Noah', lastName: 'Richter' },
      { firstName: 'Sophie', lastName: 'Bauer' },
      { firstName: 'Leon', lastName: 'Klein' },
      { firstName: 'Hannah', lastName: 'Wolf' },
      { firstName: 'Ben', lastName: 'Neumann' },
      { firstName: 'Lena', lastName: 'Schwarz' }
    ]

    const persons = await db.insert(tables.persons).values(
      germanNames.map(name => ({
        ...name,
        createdAt: now,
        updatedAt: now
      }))
    ).returning()
    console.log('✅ Personen erstellt:', persons.length)

    // 3. PersonYears definieren (wer nimmt in welchem Jahr teil)
    const personYearsData = []

    // 2024: Personen 0-9 (10 Personen)
    for (let i = 0; i < 10; i++) {
      personYearsData.push({
        personId: persons[i].id,
        year: 2024,
        isParticipating: true,
        createdAt: now,
        updatedAt: now
      })
    }

    // 2025: Personen 5-14 (10 Personen, überlappend)
    for (let i = 5; i < 15; i++) {
      personYearsData.push({
        personId: persons[i].id,
        year: 2025,
        isParticipating: true,
        createdAt: now,
        updatedAt: now
      })
    }

    // PersonYears in Batches einfügen
    const personYears: PersonYear[] = []
    const batchSize = 10
    for (let i = 0; i < personYearsData.length; i += batchSize) {
      const batch = personYearsData.slice(i, i + batchSize)
      const batchResult = await db.insert(tables.personYears).values(batch).returning()
      personYears.push(...batchResult)
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} PersonYears eingefügt: ${batch.length}`)
    }
    console.log('✅ Alle PersonYears erstellt:', personYears.length)

    // 4. Pralinen erstellen (für jedes Jahr)
    const pralinenData = [
      { name: 'Schokoladen-Truffel', description: 'Cremige Schokoladentruffel mit Kakaopulver', isVegan: false },
      { name: 'Kokos-Makronen', description: 'Luftige Kokosmakronen mit Schokoladenfüllung', isVegan: true },
      { name: 'Nuss-Pralinen', description: 'Haselnusspralinen mit Nougatkern', isVegan: false },
      { name: 'Erdbeer-Trüffel', description: 'Fruchtige Erdbeertrüffel mit weißer Schokolade', isVegan: false },
      { name: 'Mandel-Marzipan', description: 'Mandelmarzipan in dunkler Schokolade', isVegan: true },
      { name: 'Karamell-Bonbons', description: 'Sahnige Karamellbonbons mit Meersalz', isVegan: false }
    ]

    const pralinesData = []
    for (const year of years) {
      for (const praline of pralinenData) {
        pralinesData.push({
          ...praline,
          year,
          imagePath: '', // Leer wie gewünscht
          createdAt: now,
          updatedAt: now
        })
      }
    }

    // Pralinen in Batches einfügen
    const pralines: Praline[] = []
    const pralineBatchSize = 10
    for (let i = 0; i < pralinesData.length; i += pralineBatchSize) {
      const batch = pralinesData.slice(i, i + pralineBatchSize)
      const batchResult = await db.insert(tables.pralines).values(batch).returning()
      pralines.push(...batchResult)
      console.log(`✅ Batch ${Math.floor(i / pralineBatchSize) + 1} Pralinen eingefügt: ${batch.length}`)
    }
    console.log('✅ Alle Pralinen erstellt:', pralines.length)

    // 5. Ratings erstellen (alle auf einmal)
    const ratingData = []

    // Helper function to create ratings for a person in a specific year
    function createRatingsForPersonYear(personYear: typeof personYears[0], pralinesForYear: typeof pralines, ratingCount: number, personIndex: number) {
      const ratings = []
      for (let i = 0; i < ratingCount; i++) {
        const rating = Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5
        let comment: string | undefined = undefined

        // Add some realistic comments
        if (personIndex === 0 && i === 0) comment = 'Sehr lecker!'
        if (personIndex === 1 && i === 2) comment = 'Könnte süßer sein'
        if (personIndex === 3 && i === 1) comment = 'Perfekt!'
        if (personIndex === 5 && i === 0) comment = 'Erste Bewertung!'

        ratings.push({
          personYearId: personYear.id,
          pralineId: pralinesForYear[i].id,
          rating,
          comment,
          createdAt: now,
          updatedAt: now
        })
      }
      return ratings
    }

    // Bewertungen für 2024
    const pralines2024 = pralines.filter(p => p.year === 2024)
    const personYears2024 = personYears.filter(py => py.year === 2024)
    const ratingCounts2024 = [6, 5, 4, 3, 2, 1, 1, 0, 3, 4] // Realistische Verteilung

    for (let i = 0; i < personYears2024.length; i++) {
      const personRatings = createRatingsForPersonYear(personYears2024[i], pralines2024, ratingCounts2024[i], i)
      ratingData.push(...personRatings)
    }

    // Bewertungen für 2025
    const pralines2025 = pralines.filter(p => p.year === 2025)
    const personYears2025 = personYears.filter(py => py.year === 2025)
    const ratingCounts2025 = [5, 6, 3, 4, 2, 1, 0, 2, 3, 1] // Realistische Verteilung

    for (let i = 0; i < personYears2025.length; i++) {
      const personRatings = createRatingsForPersonYear(personYears2025[i], pralines2025, ratingCounts2025[i], i)
      ratingData.push(...personRatings)
    }

    // Ratings in Batches einfügen
    if (ratingData.length > 0) {
      const batchSize = 10
      for (let i = 0; i < ratingData.length; i += batchSize) {
        const batch = ratingData.slice(i, i + batchSize)
        await db.insert(tables.ratings).values(batch)
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} Ratings eingefügt: ${batch.length}`)
      }
      console.log('✅ Alle Ratings erstellt:', ratingData.length)
    }

    // 6. Einige Lieblingspralinen und Feedbacks setzen
    // 2024
    await db.update(tables.personYears)
      .set({ favoriteChocolateId: pralines2024[0].id })
      .where(eq(tables.personYears.id, personYears2024[0].id))

    await db.update(tables.personYears)
      .set({
        favoriteChocolateId: pralines2024[2].id,
        generalFeedback: 'Alle Pralinen waren sehr lecker! Besonders die Schokoladen-Truffel haben mir gefallen.',
        allergies: 'Nüsse'
      })
      .where(eq(tables.personYears.id, personYears2024[1].id))

    // 2025
    await db.update(tables.personYears)
      .set({
        favoriteChocolateId: pralines2025[1].id,
        generalFeedback: 'Dieses Jahr waren die Pralinen noch besser! Sehr kreative Kombinationen.',
        allergies: 'Gluten'
      })
      .where(eq(tables.personYears.id, personYears2025[0].id))

    await db.update(tables.personYears)
      .set({
        favoriteChocolateId: pralines2025[3].id,
        generalFeedback: 'Wunderbare Vielfalt! Besonders die fruchtigen Sorten haben überzeugt.',
        allergies: ''
      })
      .where(eq(tables.personYears.id, personYears2025[3].id))

    console.log('✅ Lieblingspralinen und Feedbacks gesetzt')

    console.log('🎉 Seeding erfolgreich abgeschlossen!')
    console.log(`📊 Zusammenfassung:`)
    console.log(`   - Jahre: ${years.join(', ')}`)
    console.log(`   - Personen: ${persons.length}`)
    console.log(`   - PersonYears: ${personYears.length}`)
    console.log(`   - Pralinen: ${pralines.length}`)
    console.log(`   - Ratings: ${ratingData.length}`)

    return {
      result: 'success',
      summary: {
        years,
        persons: persons.length,
        personYears: personYears.length,
        pralines: pralines.length,
        ratings: ratingData.length
      }
    }
  }
})
