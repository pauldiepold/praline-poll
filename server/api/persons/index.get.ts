export default eventHandler(async (event) => {
  await requireUserSession(event)

  // List all persons
  const persons = await useDB().select().from(tables.persons).all()

  return persons as Person[]
})
