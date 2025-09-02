export default eventHandler(async (event) => {
  await requireUserSession(event)
  
  const { pathname } = getRouterParams(event)

  // NuxtHub empfohlener Weg: hubBlob().serve() nutzen
  // Das handhabt CORS und Performance automatisch
  return hubBlob().serve(event, pathname)
})
