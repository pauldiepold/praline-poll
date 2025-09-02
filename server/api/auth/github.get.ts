export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    await setUserSession(event, { user })
    const currentYear = new Date().getFullYear()
    return sendRedirect(event, `/admin/years/${currentYear}`)
  }
})
