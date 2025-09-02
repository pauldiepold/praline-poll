import { eq } from 'drizzle-orm'
import { useValidatedParams, zh } from 'h3-zod'

export default eventHandler(async (event) => {
  const { id } = await useValidatedParams(event, {
    id: zh.intAsString
  })
  await requireUserSession(event)

  // Delete person
  const deletedPerson = await useDB().delete(tables.persons).where(eq(tables.persons.id, id)).returning().get()

  if (!deletedPerson) {
    throw createError({
      statusCode: 404,
      message: 'Person not found'
    })
  }

  return deletedPerson
})
