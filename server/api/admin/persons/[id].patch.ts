import { eq } from 'drizzle-orm'
import { useValidatedParams, useValidatedBody, z, zh } from 'h3-zod'

export default eventHandler(async (event) => {
  const { id } = await useValidatedParams(event, {
    id: zh.intAsString
  })
  const { firstName, lastName } = await useValidatedBody(event, {
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100)
  })
  await requireUserSession(event)

  // Update person
  const person = await useDB().update(tables.persons).set({
    firstName,
    lastName,
    updatedAt: new Date()
  }).where(eq(tables.persons.id, id)).returning().get()

  if (!person) {
    throw createError({
      statusCode: 404,
      message: 'Person not found'
    })
  }

  return person
})
