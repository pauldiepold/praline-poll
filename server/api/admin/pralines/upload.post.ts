import { createError } from 'h3'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  try {
    // Upload verarbeiten
    const uploadResult = await hubBlob().handleUpload(event, {
      formKey: 'image',
      multiple: false,
      ensure: {
        types: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: '8MB'
      },
      put: {
        addRandomSuffix: true,
        prefix: `images/pralines/${new Date().getFullYear()}`
      }
    })

    if (!uploadResult || !Array.isArray(uploadResult) || uploadResult.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Upload fehlgeschlagen'
      })
    }

    return uploadResult
  }
  catch (error) {
    console.error('Upload error:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Bild-Upload'
    })
  }
})
