export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald'
    },
    container: {
      base: 'max-w-4xl'
    },
    card: {
      slots: {
        header: 'flex flex-wrap gap-4 items-center justify-between'
      },
      body: 'space-y-4'
    }
  }
})
