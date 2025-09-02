import { useValidatedBody, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const { firstName, lastName } = await useValidatedBody(event, {
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100)
  })
  await requireUserSession(event)

  // Insert new person
  const person = await useDB().insert(tables.persons).values({
    firstName,
    lastName,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning().get()

  return person
})
